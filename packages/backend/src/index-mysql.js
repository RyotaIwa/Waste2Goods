import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import db from './db-mysql.js';
import {
  ADMIN_CREDENTIALS,
  KIOSK_PIN,
  DEMO_RESIDENT_CREDENTIALS,
  DEMO_ADMIN_USER,
  DEMO_RESIDENT_USER,
  DEMO_KIOSK_USER
} from '@waste2goods/core';
import { signToken, authenticateJWT, requireRole, hashPassword, comparePassword } from './security/auth-jwt.js';
import { globalLimiter, authLimiter, writeLimiter } from './security/rate-limit.js';
import { cacheRoute, CacheBust } from './security/cache.js';
import { validateBody, RegisterSchema, LoginSchema, TransactionSchema, RedeemSchema, RewardCRUDSchema } from './security/validate.js';
import { gatewayLogger, apiNotFound, errorHandler } from './security/gateway.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);

const DEFAULT_CORS_ORIGINS = [
  /^http:\/\/localhost(:[0-9]+)?$/,
  /^http:\/\/127\.0\.0\.1(:[0-9]+)?$/,
  /^http:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/,
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/,
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/,
];

function buildCorsOrigins() {
  const list = [...DEFAULT_CORS_ORIGINS];
  const env = process.env.CORS_ORIGINS;
  if (env) {
    for (const raw of env.split(',').map(s => s.trim()).filter(Boolean)) {
      try {
        if (raw.startsWith('/') && raw.endsWith('/')) {
          list.push(new RegExp(raw.slice(1, -1)));
        } else {
          const exact = raw;
          list.push((origin) => origin === exact);
        }
      } catch (_) {
        list.push((origin) => origin && origin.includes(raw.replace(/^https?:\/\//, '').split('/')[0]));
      }
    }
  }
  return list;
}

const CORS_ALLOWED = buildCorsOrigins();
const isProd = process.env.NODE_ENV === 'production';

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: isProd
      ? undefined
      : { 'img-src': ["'self'", 'data:', 'https:'], 'script-src': ["'self'"] },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}));
if (isProd) app.set('trust proxy', 2);
else app.set('trust proxy', 1);
app.use(globalLimiter);
app.use(gatewayLogger);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const ok = CORS_ALLOWED.some(r => typeof r === 'function' ? r(origin) : r.test(origin));
    if (ok) return cb(null, true);
    if (!isProd) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: false,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','X-Request-ID'],
  exposedHeaders: ['X-Request-ID','X-W2G-Cache','X-RateLimit-Limit','X-RateLimit-Remaining'],
  maxAge: 86400,
}));
app.use(express.json({ limit: process.env.BODY_LIMIT || '100kb' }));

// Root route - show welcome message
app.get('/', (req, res) => {
  res.json({ 
    message: 'Waste2Goods API Server is running (with MySQL/XAMPP)!',
    status: 'success',
    availableEndpoints: [
      'POST /api/auth/login',
      'POST /api/auth/register',
      'POST /api/auth/kiosk-login',
      'GET /api/users',
      'GET /api/users/:id',
      'GET /api/kiosks',
      'GET /api/rewards',
      'GET /api/transactions',
      'POST /api/transactions',
      'GET /api/analytics/weekly',
      'GET /api/analytics/monthly',
      'GET /api/leaderboard',
      'GET /api/tasks'
    ]
  });
});

// D2 P1: authenticate = real signed JWT via authenticateJWT
const authenticate = (req, res, next) => authenticateJWT(req, res, next);

// Auth Routes
app.post('/api/auth/register', authLimiter, validateBody(RegisterSchema), async (req, res) => {
  try {
    const {
      firstName, lastName, email, password,
      barangayId = 1, phone = '',
      province = '', city = '', barangayName = '',
      streetAddress = ''
    } = req.body;

    if (!province || !city || !barangayName) {
      return res.status(400).json({ error: 'Please select Province, City, and Barangay' });
    }

    const [existing] = await db.query('SELECT userId FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = await getNextUserId();
    const qrCode = `${userId}-${Math.random().toString(36).slice(2, 7)}`;

    const passwordHash = await hashPassword(password);

    await db.query(
      `INSERT INTO users 
         (userId, firstName, lastName, email, passwordHash, qr_code, barangayId,
          total_points, pointsBalance, totalSubmissions, status, phone, province, city, barangayName, streetAddress)
       VALUES (?, ?, ?, ?, ?, ?, ?, 50, 50, 0, 'active', ?, ?, ?, ?, ?)`,
      [userId, firstName, lastName, email.toLowerCase().trim(), passwordHash, qrCode, barangayId,
       phone, province, city, barangayName, streetAddress]
    );

    const [newRows] = await db.query('SELECT * FROM users WHERE userId = ?', [userId]);
    const dbUser = newRows[0];

    const user = buildResidentUserFromDb(dbUser);
    user.points = 50;
    user.submissions = 0;
    user.totalSubmissions = 0;
    user.redeemed = 0;

    const token = signToken({ userId, role: 'resident', name: user.name });
    CacheBust.users();
    res.status(201).json({ token, user, message: 'Registration successful! +50 welcome points!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', authLimiter, validateBody(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const dbAdminResult = await tryDbAdminLogin(normalizedEmail, password);
    if (dbAdminResult) return res.json(dbAdminResult);

    const hardAdminResult = tryHardcodedAdminLogin(normalizedEmail, password);
    if (hardAdminResult) return res.json(hardAdminResult);

    const hardResidentResult = tryHardcodedResidentLogin(normalizedEmail, password);
    if (hardResidentResult) return res.json(hardResidentResult);

    const residentResult = await tryResidentDbLogin(normalizedEmail, password);
    if (residentResult.error) {
      return res.status(residentResult.error.status).json({ error: residentResult.error.msg });
    }
    return res.json(residentResult);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/kiosk-login', authLimiter, (req, res) => {
  const { pin } = req.body;
  if (pin === KIOSK_PIN) {
    const token = signToken({ kioskId: 'KIOSK-01', role: 'kiosk', name: 'Recycling Kiosk' });
    return res.json({ token, user: DEMO_KIOSK_USER });
  }
  res.status(401).json({ error: 'Invalid PIN' });
});

// Protected API Routes (require authentication)
app.get('/api/users', authenticate, cacheRoute(30), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users ORDER BY createdAt ASC');
    const [txCounts] = await db.query('SELECT userId, COUNT(*) as cnt, COALESCE(SUM(weightKg),0) as totalKg, COALESCE(SUM(pointsEarned),0) as totalPtsEarned FROM recycling_transactions GROUP BY userId');
    const [redCounts] = await db.query('SELECT userId, COUNT(*) as cnt, COALESCE(SUM(quantity),0) as totalQty, COALESCE(SUM(totalPoints),0) as totalPtsUsed FROM reward_redemptions GROUP BY userId');
    const txByUser = Object.fromEntries(txCounts.map(t => [String(t.userId), t]));
    const rdByUser = Object.fromEntries(redCounts.map(r => [String(r.userId), r]));
    const usersWithCompat = rows.map(user => buildUserCompatRow(user, txByUser, rdByUser));
    res.json(usersWithCompat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', authenticate, cacheRoute(15), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE userId = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = rows[0];
    const [[txRow]] = await db.query('SELECT COUNT(*) as cnt, COALESCE(SUM(weightKg),0) as totalKg, COALESCE(SUM(pointsEarned),0) as totalPtsEarned FROM recycling_transactions WHERE userId = ?', [user.userId]);
    const [[rdRow]] = await db.query('SELECT COUNT(*) as cnt, COALESCE(SUM(quantity),0) as totalQty, COALESCE(SUM(totalPoints),0) as totalPtsUsed FROM reward_redemptions WHERE userId = ?', [user.userId]);
    const submissionsLive = Number(txRow?.cnt || 0);
    const redeemedLive = Number(rdRow?.totalQty || rdRow?.cnt || 0);
    const barangayLive = user.barangayName || 'Cabantian';
    res.json({
      ...user,
      id: user.userId,
      name: `${user.firstName} ${user.lastName}`,
      barangay: barangayLive,
      barangayName: barangayLive,
      points: user.pointsBalance,
      submissions: submissionsLive > 0 ? submissionsLive : Number(user.totalSubmissions || 0),
      totalSubmissions: submissionsLive > 0 ? submissionsLive : Number(user.totalSubmissions || 0),
      redeemed: redeemedLive,
      joined: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/kiosks', authenticate, cacheRoute(60), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM kiosks');
    const kiosksWithCompat = rows.map(kiosk => ({
      ...kiosk,
      id: kiosk.kioskId,
      weight: '—',
      submissions: 0
    }));
    res.json(kiosksWithCompat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rewards', authenticate, cacheRoute(60), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM rewards ORDER BY rewardId ASC');
    const [redCounts] = await db.query('SELECT rewardId, COUNT(*) as cnt, COALESCE(SUM(quantity),0) as totalQty, COALESCE(SUM(totalPoints),0) as totalPtsUsed FROM reward_redemptions GROUP BY rewardId');
    const rdByReward = Object.fromEntries(redCounts.map(r => [Number(r.rewardId), r]));
    const rewardsWithCompat = rows.map(r => buildRewardCompatRow(r, rdByReward));
    res.json(rewardsWithCompat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transactions from database
app.get('/api/transactions', authenticate, cacheRoute(30), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM recycling_transactions');
    const transactionsWithCompat = rows.map(tx => ({
      ...tx,
      id: tx.transactionId,
      date: new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'earn',
      desc: `PET Plastic · ${tx.weightKg} kg · ${tx.kioskId}`,
      pts: tx.pointsEarned
    }));
    res.json(transactionsWithCompat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new recycling transaction (POST)
app.post('/api/transactions', authenticate, writeLimiter, validateBody(TransactionSchema), async (req, res) => {
  try {
    const { userId, materialId, weightKg, kioskId } = req.body;
    const pointsEarned = Math.round(weightKg * 50);
    const transactionId = `RT-${Date.now()}`;

    // Insert transaction
    await db.query(
      'INSERT INTO recycling_transactions (transactionId, userId, materialId, weightKg, pointsEarned, kioskId, timestamp) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [transactionId, userId, materialId, weightKg, pointsEarned, kioskId]
    );

    // Update user's points and submissions
    await db.query(
      'UPDATE users SET pointsBalance = pointsBalance + ?, totalSubmissions = totalSubmissions + 1 WHERE userId = ?',
      [pointsEarned, userId]
    );

    CacheBust.transactions();
    res.json({ 
      message: 'Transaction created successfully', 
      transactionId, 
      pointsEarned 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// ANALYTICS ENDPOINTS — REAL DATABASE-DRIVEN DATA
// (no more hardcoded mock arrays!)
// ──────────────────────────────────────────────────────────────

// Helper: day-of-week formatter (Mon, Tue, ..., Sun)
function getDayName(dateObj) {
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dateObj.getDay()];
}
// Helper: 3-letter month formatter (Jan, Feb, ..., Dec)
function getMonthName(dateObj) {
  return dateObj.toLocaleString('en-US', { month: 'short' });
}

// ── Login helpers: reduce CC of /api/auth/login ──────────────────────────

function buildAdminUserFromDb(adm, normalizedEmail) {
  const adminName = `${adm.firstName || 'Juan'} ${adm.lastName || 'Reyes'}`;
  return {
    id: adm.adminId || `A-${adm.adminIdentifier}`,
    name: adminName,
    email: adm.adminIdentifier || normalizedEmail,
    role: 'admin',
    barangay: 'Cabantian',
    roleId: adm.roleId || 1,
    adminId: adm.adminId || null,
  };
}

function buildResidentUserFromDb(user) {
  return {
    ...user,
    id: user.userId,
    name: `${user.firstName} ${user.lastName}`,
    barangay: user.barangayName || 'Cabantian',
    points: user.pointsBalance,
    joined: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    submissions: user.totalSubmissions,
    redeemed: 0,
  };
}

async function tryDbAdminLogin(normalizedEmail, password) {
  try {
    const [adminRows] = await db.query(
      'SELECT * FROM administrators WHERE adminIdentifier = ? OR email = ? LIMIT 1',
      [normalizedEmail, normalizedEmail]
    );
    if (adminRows.length === 0) return null;
    const adm = adminRows[0];
    const pwOk = await comparePassword(password, String(adm.passwordHash || ''));
    if (!pwOk && password !== ADMIN_CREDENTIALS.password) return null;
    const adminUser = buildAdminUserFromDb(adm, normalizedEmail);
    const token = signToken({ adminId: adm.adminId || 'A-001', role: 'admin', name: adminUser.name });
    console.log(`🔐 Admin logged in from DB: ${adminUser.name} (${adminUser.id})`);
    return { token, user: adminUser };
  } catch (_) {
    return null;
  }
}

function tryHardcodedAdminLogin(normalizedEmail, password) {
  if (normalizedEmail !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) return null;
  console.log('🔐 Admin logged in via hardcoded fallback');
  const token = signToken({ adminId: 'A-001', role: 'admin', name: DEMO_ADMIN_USER.name });
  return { token, user: DEMO_ADMIN_USER };
}

function tryHardcodedResidentLogin(normalizedEmail, password) {
  if (normalizedEmail !== DEMO_RESIDENT_CREDENTIALS.email || password !== DEMO_RESIDENT_CREDENTIALS.password) return null;
  console.log('🔐 Resident logged in via hardcoded fallback');
  const token = signToken({ userId: 'U-001', role: 'resident', name: DEMO_RESIDENT_USER.name });
  return { token, user: DEMO_RESIDENT_USER };
}

async function tryResidentDbLogin(normalizedEmail, password) {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
  if (rows.length === 0) {
    return { error: { status: 401, msg: 'Invalid credentials or user not registered yet. Please sign up first!' } };
  }
  const user = rows[0];
  const pwOk = await comparePassword(password, String(user.passwordHash || ''));
  if (!pwOk) {
    return { error: { status: 401, msg: 'Invalid credentials' } };
  }
  const userWithCompat = buildResidentUserFromDb(user);
  const token = signToken({ userId: user.userId, role: 'resident', name: userWithCompat.name });
  console.log(`🔐 Resident logged in from DB: ${userWithCompat.name} (${user.userId})`);
  return { token, user: userWithCompat };
}

// ── Notification builders: reduce CC of /api/notifications endpoints ─────

function formatFullName(firstName, lastName, fallback) {
  const full = `${firstName || ''} ${lastName || ''}`.trim();
  return full || fallback;
}

function toIsoTime(dateVal) {
  return dateVal ? new Date(dateVal).toISOString() : new Date().toISOString();
}

function redemptionSeverity(status) {
  if (status === 'ready' || status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  return 'info';
}

function buildAdminRedemptionNotif(rd) {
  const residentName = formatFullName(rd.firstName, rd.lastName, 'Resident');
  return {
    id: `redeem-${rd.redemptionId}`,
    type: 'redemption',
    title: `${residentName} redeemed a reward`,
    message: `${rd.rewardName || 'Reward'} — status: ${rd.status || 'pending'}`,
    time: toIsoTime(rd.redemptionDate),
    severity: redemptionSeverity(rd.status),
    meta: { redemptionId: rd.redemptionId, userId: rd.userId, rewardName: rd.rewardName, status: rd.status }
  };
}

function buildAdminNewUserNotif(u) {
  return {
    id: `newuser-${u.userId}`,
    type: 'newUser',
    title: `New user registered: ${u.firstName} ${u.lastName}`,
    message: u.email || '',
    time: toIsoTime(u.createdAt),
    severity: 'info',
    meta: { userId: u.userId, email: u.email }
  };
}

function buildAdminTxMilestoneNotif(t) {
  const pts = Number(t.pointsEarned || 0);
  if (pts < 100) return null;
  const residentName = formatFullName(t.firstName, t.lastName, '');
  return {
    id: `tx-${t.transactionId}`,
    type: 'milestone',
    title: `Big drop-off: ${residentName}`.trim(),
    message: `${t.weightKg} kg at ${t.kioskId} — earned +${pts} pts`,
    time: toIsoTime(t.timestamp),
    severity: 'success',
    meta: { transactionId: t.transactionId, userId: t.userId }
  };
}

function sortNotificationsByTime(list) {
  list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return list;
}

function buildTxSubmissionNotif(t) {
  const kg = Number(t.weightKg || 0).toFixed(1);
  const pts = Number(t.pointsEarned || 0);
  const isBig = pts >= 100 || Number(t.weightKg || 0) >= 5;
  return {
    id: `tx-${t.transactionId}`,
    type: isBig ? 'milestone' : 'submission',
    title: isBig ? `🎉 Heavy drop-off recorded!` : `✅ Drop-off recorded`,
    message: `${kg} kg PET plastic at ${t.kioskId || 'Kiosk'} · earned +${pts} points`,
    time: toIsoTime(t.timestamp),
    severity: 'success',
    read: true,
    meta: { transactionId: t.transactionId, weightKg: t.weightKg, pointsEarned: t.pointsEarned }
  };
}

function redemptionTitleAndSeverity(status) {
  if (status === 'ready' || status === 'approved') {
    return { title: "✅ Reward is ready to claim!", severity: 'success' };
  }
  if (status === 'claimed' || status === 'completed') {
    return { title: "🎁 Reward successfully claimed", severity: 'success' };
  }
  if (status === 'rejected') {
    return { title: "⚠️ Redemption was not approved", severity: 'danger' };
  }
  if (status === 'pending') {
    return { title: "⏳ Redemption is being processed", severity: 'info' };
  }
  return { title: "🎁 Reward redemption", severity: 'info' };
}

function buildMyRedeemNotif(rd) {
  const status = rd.status || 'pending';
  const { title, severity } = redemptionTitleAndSeverity(status);
  const unreadStatuses = ['pending', 'ready', 'approved'];
  return {
    id: `redeem-${rd.redemptionId}`,
    type: 'redemption',
    title,
    message: `${rd.rewardName || 'Reward'} × ${rd.quantity || 1} · ${rd.totalPoints || 0} pts · ${String(status).toUpperCase()}`,
    time: toIsoTime(rd.redemptionDate),
    severity,
    read: !unreadStatuses.includes(status),
    meta: { redemptionId: rd.redemptionId, rewardId: rd.rewardId, rewardName: rd.rewardName, status }
  };
}

function deriveTierFromPoints(ptsBal) {
  if (ptsBal >= 5000) return 'Platinum';
  if (ptsBal >= 2000) return 'Gold';
  if (ptsBal >= 500) return 'Silver';
  return 'Bronze';
}

async function safeLoadUserWithTier(userId) {
  try {
    const [rows] = await db.query(
      "SELECT userId, firstName, lastName, createdAt, pointsBalance, totalSubmissions, tier, phone FROM users WHERE userId = ? LIMIT 1",
      [userId]
    );
    if (rows && rows.length && rows[0]) {
      const u = rows[0];
      if (!u.tier) u.tier = deriveTierFromPoints(Number(u.pointsBalance || 0));
      return u;
    }
    return null;
  } catch (tierErr) {
    if (tierErr.code === 'ER_BAD_FIELD_ERROR' && /'tier'/.test(tierErr.sqlMessage || '')) {
      const [rows] = await db.query(
        "SELECT userId, firstName, lastName, createdAt, pointsBalance, totalSubmissions, phone FROM users WHERE userId = ? LIMIT 1",
        [userId]
      );
      if (!rows || !rows.length || !rows[0]) return null;
      const u = rows[0];
      u.tier = deriveTierFromPoints(Number(u.pointsBalance || 0));
      return u;
    }
    throw tierErr;
  }
}

function buildUserWelcomeNotif(u) {
  if (!u.createdAt) return null;
  return {
    id: `welcome-${u.userId}`,
    type: 'welcome',
    title: "👋 Welcome to Waste2Goods!",
    message: "Your account was created. Enjoy your 50 welcome bonus points!",
    time: new Date(u.createdAt).toISOString(),
    severity: 'info',
    read: true,
    meta: { userId: u.userId }
  };
}

function buildUserMilestoneNotifs(u) {
  const notifs = [];
  const nSubs = Number(u.totalSubmissions || 0);
  const pts = Number(u.pointsBalance || 0);
  const createdTime = new Date(u.createdAt || Date.now()).toISOString();
  if (nSubs >= 10) {
    notifs.push({
      id: `milestone-10sub-${u.userId}`,
      type: 'milestone',
      title: "🏆 10 Submissions Badge unlocked!",
      message: `Amazing job completing ${nSubs} recycling drop-offs. Keep it up!`,
      time: createdTime,
      severity: 'success',
      read: true,
      meta: { kind: 'submissions', count: nSubs }
    });
  }
  if (nSubs >= 50) {
    notifs.push({
      id: `milestone-50sub-${u.userId}`,
      type: 'milestone',
      title: "👑 Eco Champion Badge!",
      message: `${nSubs} drop-offs completed — you're a true eco warrior!`,
      time: createdTime,
      severity: 'success',
      read: true,
      meta: { kind: 'submissions', count: nSubs }
    });
  }
  if (u.tier && u.tier !== 'Bronze') {
    notifs.push({
      id: `tier-${u.userId}-${u.tier}`,
      type: 'milestone',
      title: `⬆️ Tier upgraded to ${u.tier}!`,
      message: `Tier ${u.tier} unlocked with ${pts} lifetime points — great work!`,
      time: createdTime,
      severity: 'success',
      read: true,
      meta: { tier: u.tier, pointsBalance: pts }
    });
  }
  return notifs;
}

function buildTaskNotif(tk) {
  return {
    id: `task-${tk.taskId}`,
    type: 'task',
    title: `📋 New weekly task: ${tk.taskName}`,
    message: `${tk.description || 'Complete and earn'} · Reward: ${tk.pointsReward || 0} pts`,
    time: tk.startDate ? new Date(tk.startDate).toISOString() : new Date().toISOString(),
    severity: 'info',
    read: false,
    meta: { taskId: tk.taskId, pointsReward: tk.pointsReward }
  };
}

// ── Register helper: reduce CC of /api/auth/register ────────────────────

async function getNextUserId() {
  const [[maxUserRow]] = await db.query(
    "SELECT COALESCE(MAX(CAST(SUBSTRING(userId, 3) AS UNSIGNED)), 0) AS maxNum FROM users"
  );
  const userNumber = Number(maxUserRow.maxNum || 0) + 1;
  return `U-${String(userNumber).padStart(3, '0')}`;
}

// ── Analytics / user-row mapper helpers ──────────────────────────────────

function formatDateShort(dateVal) {
  return new Date(dateVal || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildUserCompatRow(user, txByUser, rdByUser) {
  const tx = txByUser[String(user.userId)];
  const rd = rdByUser[String(user.userId)];
  const submissionsLive = Number(tx?.cnt || 0);
  const redeemedLive = Number(rd?.totalQty || rd?.cnt || 0);
  const barangayLive = user.barangayName || 'Cabantian';
  return {
    ...user,
    id: user.userId,
    name: `${user.firstName} ${user.lastName}`,
    barangay: barangayLive,
    barangayName: barangayLive,
    points: user.pointsBalance,
    submissions: submissionsLive > 0 ? submissionsLive : Number(user.totalSubmissions || 0),
    totalSubmissions: submissionsLive > 0 ? submissionsLive : Number(user.totalSubmissions || 0),
    redeemed: redeemedLive,
    joined: formatDateShort(user.createdAt)
  };
}

function buildRewardCompatRow(r, rdByReward) {
  const rd = rdByReward[Number(r.rewardId)];
  return {
    ...r,
    id: r.rewardId,
    name: r.rewardName,
    points: r.pointsCost,
    stock: r.stockQuantity,
    stockCount: r.stockQuantity,
    redeemed: Number(rd?.totalQty || rd?.cnt || 0),
    isSeasonal: Boolean(r.isSeasonal),
    seasonal: Boolean(r.isSeasonal),
  };
}

function buildLeaderboardRow(user, index) {
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.userId || 'Resident';
  const avatar = name
    .split(/\s+/)
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const subs = Number(user.totalSubmissions || 0);
  return {
    rank: index + 1,
    userId: user.userId,
    id: user.userId,
    name,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    barangay: user.barangayName || 'Cabantian',
    barangayName: user.barangayName || 'Cabantian',
    barangayId: user.barangayId || null,
    points: Number(user.pointsBalance || 0),
    pointsBalance: Number(user.pointsBalance || 0),
    submissions: subs,
    totalSubmissions: subs,
    tier: user.tier || null,
    phone: user.phone || '',
    avatar,
    streak: subs > 0 ? Math.min(30, Math.max(1, Math.ceil(subs / 2))) : 1,
  };
}

// Weekly analytics — GROUP recycling_transactions by DAY of the past 7 days
app.get('/api/analytics/weekly', authenticate, cacheRoute(60), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DATE(timestamp) AS day, SUM(weightKg) AS kg
      FROM recycling_transactions
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(timestamp)
      ORDER BY DATE(timestamp) ASC
    `);
    if (rows.length === 0) {
      // Empty DB — return classic sample shape as default fallback only, not hardcoded UI
      return res.json([
        { day: 'Mon', kg: 0 }, { day: 'Tue', kg: 0 }, { day: 'Wed', kg: 0 },
        { day: 'Thu', kg: 0 }, { day: 'Fri', kg: 0 }, { day: 'Sat', kg: 0 }, { day: 'Sun', kg: 0 }
      ]);
    }
    res.json(rows.map(r => ({ day: getDayName(new Date(r.day)), kg: Math.round(Number(r.kg) * 10) / 10 })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly analytics — GROUP transactions & users by MONTH of current year
app.get('/api/analytics/monthly', authenticate, cacheRoute(60), async (req, res) => {
  try {
    const [txRows] = await db.query(`
      SELECT DATE_FORMAT(timestamp, '%Y-%m') AS ym,
             SUM(weightKg) AS collected,
             COUNT(DISTINCT userId) AS users
      FROM recycling_transactions
      WHERE YEAR(timestamp) = YEAR(NOW())
      GROUP BY DATE_FORMAT(timestamp, '%Y-%m')
      ORDER BY ym ASC
    `);
    // Rewards redeemed per month
    const [redRows] = await db.query(`
      SELECT DATE_FORMAT(redemptionDate, '%Y-%m') AS ym, COUNT(*) AS redeemed
      FROM reward_redemptions
      WHERE YEAR(redemptionDate) = YEAR(NOW())
      GROUP BY DATE_FORMAT(redemptionDate, '%Y-%m')
      ORDER BY ym ASC
    `);
    const redeemedByMonth = Object.fromEntries(redRows.map(r => [r.ym, Number(r.redeemed)]));
    const monthly = txRows.map(r => ({
      month: getMonthName(new Date(r.ym + '-01')),
      collected: Math.round(Number(r.collected)),
      users: Number(r.users),
      redeemed: redeemedByMonth[r.ym] || 0,
    }));
    if (monthly.length === 0) {
      return res.json([
        { month: 'Jan', collected: 0, users: 0, redeemed: 0 },
        { month: 'Feb', collected: 0, users: 0, redeemed: 0 },
        { month: 'Mar', collected: 0, users: 0, redeemed: 0 },
        { month: 'Apr', collected: 0, users: 0, redeemed: 0 },
        { month: 'May', collected: 0, users: 0, redeemed: 0 },
        { month: 'Jun', collected: 0, users: 0, redeemed: 0 },
      ]);
    }
    res.json(monthly);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NEW: Dashboard Summary endpoint — computes stat card TOTALS from real DB tables
//    totalKgCollected | totalTransactions | totalUsers | activeResidents | totalPointsAwarded | rewardsRedeemed
// +  recentTransactions (top 8 with user names) + top5 leaderboard
app.get('/api/analytics/summary', authenticate, cacheRoute(30), async (req, res) => {
  try {
    // Total collected kg & points & submissions from transactions
    const [sum1] = await db.query(`
      SELECT COALESCE(SUM(weightKg),0) AS totalKgCollected,
             COALESCE(SUM(pointsEarned),0) AS totalPointsAwarded,
             COUNT(*) AS totalTransactions
      FROM recycling_transactions
    `);
    // Total users & active residents (active = status='active' AND submissions > 0)
    const [sum2] = await db.query(`
      SELECT COUNT(*) AS totalUsers,
             SUM(CASE WHEN status='active' AND totalSubmissions>0 THEN 1 ELSE 0 END) AS activeResidents
      FROM users
    `);
    // Rewards redeemed
    const [sum3] = await db.query(`SELECT COUNT(*) AS rewardsRedeemed FROM reward_redemptions`);
    // Rewards low stock (<10)
    const [sum4] = await db.query(`SELECT COUNT(*) AS lowStock FROM rewards WHERE stockQuantity < 10 AND status='active'`);
    // Kiosks online
    const [sum5] = await db.query(`
      SELECT SUM(CASE WHEN status='online' THEN 1 ELSE 0 END) AS kiosksOnline,
             COUNT(*) AS totalKiosks
      FROM kiosks
    `);

    // ── Recent 8 transactions WITH user names ──
    const [recentTx] = await db.query(`
      SELECT t.transactionId, t.timestamp, t.weightKg, t.pointsEarned, t.kioskId, t.userId,
             u.firstName, u.lastName
      FROM recycling_transactions t
      LEFT JOIN users u ON u.userId = t.userId
      ORDER BY t.timestamp DESC
      LIMIT 8
    `);
    const recent = recentTx.map(t => ({
      id: t.transactionId,
      date: new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'earn',
      desc: `${t.firstName || 'Unknown'} ${t.lastName || 'User'} · PET Plastic · ${t.weightKg} kg · ${t.kioskId}`,
      pts: Number(t.pointsEarned),
    }));

    // ── Top 5 Leaderboard ──
    const [lbRows] = await db.query(`
      SELECT userId, firstName, lastName, barangayName, pointsBalance, totalSubmissions, tier, phone
      FROM users
      ORDER BY pointsBalance DESC
      LIMIT 5
    `);
    const leaderboard = lbRows.map((u, i) => {
      const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.userId || 'Resident';
      const avatar = name.split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
      const subs = Number(u.totalSubmissions || 0);
      return {
        rank: i + 1,
        userId: u.userId,
        id: u.userId,
        name,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        barangay: u.barangayName || 'Cabantian',
        barangayName: u.barangayName || 'Cabantian',
        points: Number(u.pointsBalance || 0),
        pointsBalance: Number(u.pointsBalance || 0),
        submissions: subs,
        totalSubmissions: subs,
        tier: u.tier || null,
        avatar,
        streak: subs > 0 ? Math.min(30, Math.max(1, Math.ceil(subs / 2))) : 1,
      };
    });

    res.json({
      totalKgCollected: Number(sum1[0].totalKgCollected),
      totalTransactions: Number(sum1[0].totalTransactions),
      totalPointsAwarded: Number(sum1[0].totalPointsAwarded),
      totalUsers: Number(sum2[0].totalUsers),
      activeResidents: Number(sum2[0].activeResidents || 0),
      rewardsRedeemed: Number(sum3[0].rewardsRedeemed),
      lowStockRewards: Number(sum4[0].lowStock),
      kiosksOnline: Number(sum5[0].kiosksOnline || 0),
      totalKiosks: Number(sum5[0].totalKiosks || 0),
      recentTransactions: recent,
      topResidents: leaderboard,
      computedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────
// REDEEM: User spends points to claim a reward
// (deducts points, inserts redemption row, decrements stock)
// ──────────────────────────────────────────────────────
app.post('/api/rewards/redeem', authenticate, writeLimiter, validateBody(RedeemSchema), async (req, res) => {
  try {
    const { userId, rewardId, quantity = 1 } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE userId = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = users[0];

    const [rewards] = await db.query('SELECT * FROM rewards WHERE rewardId = ?', [rewardId]);
    if (rewards.length === 0) return res.status(404).json({ error: 'Reward not found' });
    const reward = rewards[0];
    const stock = Number(reward.stockQuantity ?? reward.stock ?? reward.stockCount ?? 0);
    if (stock < quantity) return res.status(400).json({ error: 'Not enough stock' });

    const totalPoints = Number(reward.pointsCost || reward.points || 0) * Number(quantity);
    const userBal = Number(user.pointsBalance || 0);
    if (userBal < totalPoints) {
      return res.status(400).json({ error: `Not enough points. Balance: ${userBal}, needed: ${totalPoints}` });
    }

    const redemptionId = `RR-${Date.now()}`;
    const approvedBy = 'A-001';

    await db.query('START TRANSACTION');
    try {
      await db.query(
        'INSERT INTO reward_redemptions (redemptionId, userId, rewardId, pointsUsed, quantity, totalPoints, status, approvedBy, redemptionDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [redemptionId, userId, rewardId, Number(reward.pointsCost || reward.points || 0), quantity, totalPoints, 'ready', approvedBy]
      );
      await db.query('UPDATE users SET pointsBalance = pointsBalance - ? WHERE userId = ?', [totalPoints, userId]);
      await db.query('UPDATE rewards SET stockQuantity = stockQuantity - ? WHERE rewardId = ?', [quantity, rewardId]);
      await db.query('COMMIT');
    } catch (txErr) {
      await db.query('ROLLBACK');
      throw txErr;
    }

    const [updatedUserRows] = await db.query('SELECT * FROM users WHERE userId = ?', [userId]);
    const updatedUser = updatedUserRows[0];
    CacheBust.redemptions();
    res.json({
      ok: true,
      redemptionId,
      status: 'ready',
      newBalance: Number(updatedUser.pointsBalance || 0),
      totalPointsUsed: totalPoints,
      rewardName: reward.rewardName || reward.name,
      message: 'Pick up at Barangay Hall within 7 days. Bring a valid ID.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NEW: Reward Redemptions endpoint (list all redemptions from reward_redemptions table)
app.get('/api/redemptions', authenticate, cacheRoute(30), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.redemptionId, r.userId, r.rewardId, r.pointsUsed, r.quantity, r.totalPoints,
             r.status, r.approvedBy, r.redemptionDate,
             u.firstName, u.lastName, w.rewardName, w.icon, w.category
      FROM reward_redemptions r
      LEFT JOIN users u ON u.userId = r.userId
      LEFT JOIN rewards w ON w.rewardId = r.rewardId
      ORDER BY r.redemptionDate DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/leaderboard', authenticate, cacheRoute(60), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT userId, firstName, lastName, email, barangayId, barangayName, pointsBalance, totalSubmissions, tier, phone, createdAt, status FROM users ORDER BY pointsBalance DESC LIMIT 10');
    const leaderboard = rows.map(buildLeaderboardRow);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tasks', authenticate, (req, res) => {
  res.json([
    { id: 1, title: 'Submit 2kg of PET bottles', reward: 100, progress: 1.4, goal: 2, unit: 'kg', type: 'daily', done: false },
    { id: 2, title: 'Visit kiosk 3 days in a row', reward: 150, progress: 2, goal: 3, unit: 'days', type: 'weekly', done: false },
    { id: 3, title: 'Refer a neighbor', reward: 200, progress: 1, goal: 1, unit: 'person', type: 'special', done: true },
    { id: 4, title: 'Collect 5kg of cardboard', reward: 120, progress: 5, goal: 5, unit: 'kg', type: 'weekly', done: true },
    { id: 5, title: 'Submit any 3 material types', reward: 80, progress: 2, goal: 3, unit: 'types', type: 'daily', done: false }
  ]);
});

// ──────────────────────────────────────────────────────
// ADMIN MANAGEMENT: List + Create (authenticated admins only)
// ──────────────────────────────────────────────────────
app.get('/api/admin/admins', authenticate, cacheRoute(60), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT adminId, adminIdentifier, firstName, lastName, roleId, barangayId, createdAt FROM administrators ORDER BY createdAt ASC');
    res.json(rows.map(a => ({
      adminId: a.adminId,
      email: a.adminIdentifier,
      firstName: a.firstName,
      lastName: a.lastName,
      name: `${a.firstName} ${a.lastName}`,
      roleId: a.roleId,
      barangayId: a.barangayId,
      createdAt: a.createdAt
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/admins', authenticate, writeLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, password, barangayId = 1, roleId = 1 } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const [existing] = await db.query('SELECT * FROM administrators WHERE adminIdentifier = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An admin with this email already exists' });
    }
    // Admin ID generation: use MAX numeric suffix (same fix as user IDs)
    const [[maxAdminRow]] = await db.query(
      "SELECT COALESCE(MAX(CAST(SUBSTRING(adminId, 3) AS UNSIGNED)), 0) AS maxNum FROM administrators"
    );
    const nextNum = Number(maxAdminRow.maxNum || 0) + 1;
    const adminId = `A-${String(nextNum).padStart(3, '0')}`;
    const passwordHash = await hashPassword(password);
    const createdAt = new Date();
    await db.query(
      'INSERT INTO administrators (adminId, email, adminIdentifier, firstName, lastName, passwordHash, barangayId, roleId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [adminId, email.toLowerCase().trim(), email.toLowerCase().trim(), firstName, lastName, passwordHash, barangayId, roleId, createdAt]
    );
    CacheBust.all();
    res.json({
      ok: true,
      admin: {
        adminId,
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        roleId,
        barangayId,
        createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Admin Account
app.delete('/api/admin/admins/:id', authenticate, writeLimiter, async (req, res) => {
  try {
    const adminId = String(req.params.id).trim();
    if (adminId === 'A-001' || adminId.toLowerCase() === 'admin@waste2goods.ph') {
      return res.status(400).json({ error: 'Primary super administrator A-001 cannot be deleted' });
    }
    const [exists] = await db.query('SELECT * FROM administrators WHERE adminId = ? OR adminIdentifier = ?', [adminId, adminId]);
    if (!exists.length) {
      return res.status(404).json({ error: 'Admin account not found' });
    }
    await db.query('DELETE FROM administrators WHERE adminId = ? OR adminIdentifier = ?', [adminId, adminId]);
    CacheBust.all();
    res.json({ ok: true, adminId, message: 'Admin account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// REWARDS CRUD (Admin: Create / Update / Delete reward)
// ─────────────────────────────────────────────────────────
app.post('/api/rewards', authenticate, writeLimiter, validateBody(RewardCRUDSchema), async (req, res) => {
  try {
    const { rewardName, pointsCost, stockQuantity = 0, description = '', category = 'Eco Essentials', icon = '🎁', isSeasonal = 0, status = 'active' } = req.body;
    await db.query(
      'INSERT INTO rewards (rewardName, pointsCost, stockQuantity, description, category, icon, isSeasonal, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [String(rewardName).trim(), Number(pointsCost), Number(stockQuantity), String(description), String(category), String(icon), isSeasonal ? 1 : 0, String(status)]
    );
    const [rows] = await db.query('SELECT * FROM rewards ORDER BY rewardId DESC LIMIT 1');
    const r = rows[0];
    CacheBust.rewards();
    res.json({
      ok: true,
      reward: {
        ...r,
        id: r.rewardId,
        name: r.rewardName,
        points: r.pointsCost,
        stock: r.stockQuantity,
        stockCount: r.stockQuantity,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rewards/:id', authenticate, writeLimiter, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rewardName, pointsCost, stockQuantity, description, category, icon, isSeasonal, status } = req.body;
    const [exists] = await db.query('SELECT * FROM rewards WHERE rewardId = ?', [id]);
    if (!exists.length) return res.status(404).json({ error: 'Reward not found' });
    const curr = exists[0];
    const nextName = rewardName != null ? String(rewardName).trim() : curr.rewardName;
    const nextPoints = pointsCost != null ? Number(pointsCost) : curr.pointsCost;
    const nextStock = stockQuantity != null ? Number(stockQuantity) : curr.stockQuantity;
    const nextDesc = description != null ? String(description) : curr.description;
    const nextCat = category != null ? String(category) : curr.category;
    const nextIcon = icon != null ? String(icon) : curr.icon;
    const nextSeason = isSeasonal != null ? (isSeasonal ? 1 : 0) : curr.isSeasonal;
    const nextStatus = status != null ? String(status) : curr.status;
    await db.query(
      'UPDATE rewards SET rewardName = ?, pointsCost = ?, stockQuantity = ?, description = ?, category = ?, icon = ?, isSeasonal = ?, status = ? WHERE rewardId = ?',
      [nextName, nextPoints, nextStock, nextDesc, nextCat, nextIcon, nextSeason, nextStatus, id]
    );
    const [rows] = await db.query('SELECT * FROM rewards WHERE rewardId = ?', [id]);
    const r = rows[0];
    CacheBust.rewards();
    res.json({
      ok: true,
      reward: {
        ...r,
        id: r.rewardId,
        name: r.rewardName,
        points: r.pointsCost,
        stock: r.stockQuantity,
        stockCount: r.stockQuantity,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rewards/:id', authenticate, writeLimiter, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [exists] = await db.query('SELECT * FROM rewards WHERE rewardId = ?', [id]);
    if (!exists.length) return res.status(404).json({ error: 'Reward not found' });
    // Soft delete: set status to 'inactive' (foreign key constraints prevent hard delete if there are redemptions)
    try {
      await db.query('DELETE FROM rewards WHERE rewardId = ?', [id]);
    } catch {
      await db.query("UPDATE rewards SET status = 'inactive' WHERE rewardId = ?", [id]);
    }
    CacheBust.rewards();
    res.json({ ok: true, rewardId: id, deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// USERS — Admin Create / Update / Adjust Points
// ─────────────────────────────────────────────────────────
app.post('/api/users', authenticate, writeLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, password, barangayId = 1, pointsBalance = 0, phone = '', province = '', city = '', barangayName = 'Cabantian', streetAddress = '' } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'firstName, lastName, email, password are required' });
    }
    const [existing] = await db.query('SELECT userId FROM users WHERE email = ?', [String(email).toLowerCase().trim()]);
    if (existing.length) return res.status(400).json({ error: 'A user with this email already exists' });
    // Admin Create User endpoint: use MAX-based ID generation (same fix as register)
    const [[maxUserRow2]] = await db.query(
      "SELECT COALESCE(MAX(CAST(SUBSTRING(userId, 3) AS UNSIGNED)), 0) AS maxNum FROM users"
    );
    const nextNum = Number(maxUserRow2.maxNum || 0) + 1;
    const userId = `U-${String(nextNum).padStart(3, '0')}`;
    const passwordHash = await hashPassword(password);
    await db.query(
      'INSERT INTO users (userId, firstName, lastName, email, passwordHash, barangayId, pointsBalance, totalSubmissions, status, phone, province, city, barangayName, streetAddress) VALUES (?, ?, ?, ?, ?, ?, ?, 0, "active", ?, ?, ?, ?, ?)',
      [userId, String(firstName).trim(), String(lastName).trim(), String(email).toLowerCase().trim(), passwordHash, Number(barangayId), Number(pointsBalance), String(phone), String(province), String(city), String(barangayName), String(streetAddress)]
    );
    const [rows] = await db.query('SELECT * FROM users WHERE userId = ?', [userId]);
    const u = rows[0];
    CacheBust.users();
    res.json({
      ok: true,
      user: {
        ...u,
        id: u.userId,
        name: `${u.firstName} ${u.lastName}`,
        points: u.pointsBalance,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', authenticate, writeLimiter, async (req, res) => {
  try {
    const userId = String(req.params.id).toUpperCase();
    const { firstName, lastName, email, barangayId, pointsBalance, phone, province, city, barangayName, streetAddress, status, passwordHash } = req.body;
    const [exists] = await db.query('SELECT * FROM users WHERE userId = ?', [userId]);
    if (!exists.length) return res.status(404).json({ error: 'User not found' });
    const curr = exists[0];
    const nextFirstName = firstName != null ? String(firstName).trim() : curr.firstName;
    const nextLastName = lastName != null ? String(lastName).trim() : curr.lastName;
    const nextEmail = email != null ? String(email).toLowerCase().trim() : curr.email;
    const nextBarangayId = barangayId != null ? Number(barangayId) : curr.barangayId;
    const nextPoints = pointsBalance != null ? Number(pointsBalance) : curr.pointsBalance;
    const nextPhone = phone != null ? String(phone) : curr.phone ?? '';
    const nextProvince = province != null ? String(province) : curr.province ?? '';
    const nextCity = city != null ? String(city) : curr.city ?? '';
    const nextBarangayName = barangayName != null ? String(barangayName) : curr.barangayName ?? '';
    const nextStreet = streetAddress != null ? String(streetAddress) : curr.streetAddress ?? '';
    const nextStatus = status != null ? String(status) : curr.status ?? 'active';
    const nextPasswordHash = passwordHash != null ? String(passwordHash) : curr.passwordHash;
    await db.query(
      'UPDATE users SET firstName = ?, lastName = ?, email = ?, barangayId = ?, pointsBalance = ?, phone = ?, province = ?, city = ?, barangayName = ?, streetAddress = ?, status = ?, passwordHash = ? WHERE userId = ?',
      [nextFirstName, nextLastName, nextEmail, nextBarangayId, nextPoints, nextPhone, nextProvince, nextCity, nextBarangayName, nextStreet, nextStatus, nextPasswordHash, userId]
    );
    const [rows] = await db.query('SELECT * FROM users WHERE userId = ?', [userId]);
    const u = rows[0];
    CacheBust.users();
    res.json({
      ok: true,
      user: {
        ...u,
        id: u.userId,
        name: `${u.firstName} ${u.lastName}`,
        points: u.pointsBalance,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/points', authenticate, writeLimiter, async (req, res) => {
  try {
    const userId = String(req.params.id).toUpperCase();
    const { delta, reason = 'Admin adjustment', adminId = 'A-001' } = req.body;
    if (delta == null) return res.status(400).json({ error: 'delta is required (+/- integer points)' });
    const [exists] = await db.query('SELECT * FROM users WHERE userId = ?', [userId]);
    if (!exists.length) return res.status(404).json({ error: 'User not found' });
    const current = Number(exists[0].pointsBalance || 0);
    const next = Math.max(0, current + Number(delta));
    await db.query('UPDATE users SET pointsBalance = ? WHERE userId = ?', [next, userId]);
    CacheBust.users();
    res.json({
      ok: true,
      userId,
      previousBalance: current,
      newBalance: next,
      delta: Number(delta),
      reason,
      adminId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// NOTIFICATIONS — Recent admin activity feed
// (new redemptions, new users, high-collection transactions)
// ─────────────────────────────────────────────────────────
app.get('/api/notifications', authenticate, cacheRoute(15), async (req, res) => {
  try {
    const notifications = [];
    const [redemptions] = await db.query(
      "SELECT rr.redemptionId, rr.userId, rr.rewardId, rr.status, rr.redemptionDate, r.rewardName, u.firstName, u.lastName FROM reward_redemptions rr LEFT JOIN rewards r ON rr.rewardId = r.rewardId LEFT JOIN users u ON rr.userId = u.userId ORDER BY rr.redemptionDate DESC LIMIT 8"
    );
    for (const rd of redemptions) notifications.push(buildAdminRedemptionNotif(rd));

    const [newUsers] = await db.query('SELECT userId, firstName, lastName, email, createdAt FROM users ORDER BY createdAt DESC LIMIT 5');
    for (const u of newUsers) notifications.push(buildAdminNewUserNotif(u));

    const [tx] = await db.query(
      "SELECT t.transactionId, t.userId, t.weightKg, t.pointsEarned, t.kioskId, t.timestamp, u.firstName, u.lastName FROM recycling_transactions t LEFT JOIN users u ON t.userId = u.userId ORDER BY t.timestamp DESC LIMIT 5"
    );
    for (const t of tx) {
      const notif = buildAdminTxMilestoneNotif(t);
      if (notif) notifications.push(notif);
    }

    sortNotificationsByTime(notifications);
    const unread = notifications.filter(n => n.type === 'redemption' && (n.meta?.status === 'pending' || n.meta?.status === 'ready')).length;
    res.json({ count: notifications.length, unread: Math.max(0, unread), items: notifications });
  } catch (err) {
    res.json({ count: 0, unread: 0, items: [] });
  }
});

// ─────────────────────────────────────────────────────────
// USER-SPECIFIC NOTIFICATIONS — For the mobile app bell 🔔
// (scoped to ONE resident: their submissions, redemptions,
//  tasks completed, milestone badges, tier changes)
// ─────────────────────────────────────────────────────────
app.get('/api/users/:id/notifications', authenticate, async (req, res) => {
  const userId = String(req.params.id).toUpperCase();
  const notifications = [];
  const limit = 25;
  try {
    const [txList] = await db.query(
      "SELECT t.transactionId, t.weightKg, t.pointsEarned, t.kioskId, t.timestamp FROM recycling_transactions t WHERE t.userId = ? ORDER BY t.timestamp DESC LIMIT ?",
      [userId, limit]
    );
    for (const t of txList) notifications.push(buildTxSubmissionNotif(t));

    const [myRedeems] = await db.query(
      "SELECT rr.redemptionId, rr.rewardId, rr.quantity, rr.totalPoints, rr.status, rr.redemptionDate, r.rewardName, r.icon FROM reward_redemptions rr LEFT JOIN rewards r ON rr.rewardId = r.rewardId WHERE rr.userId = ? ORDER BY rr.redemptionDate DESC LIMIT ?",
      [userId, limit]
    );
    for (const rd of myRedeems) notifications.push(buildMyRedeemNotif(rd));

    const u = await safeLoadUserWithTier(userId);
    if (u) {
      const welcomeNotif = buildUserWelcomeNotif(u);
      if (welcomeNotif) notifications.push(welcomeNotif);
      for (const mn of buildUserMilestoneNotifs(u)) notifications.push(mn);
    }

    try {
      const [tasks] = await db.query(
        "SELECT taskId, taskName, description, pointsReward, status, startDate, endDate FROM tasks WHERE (status = 'active' OR status = '1' OR status = 1) ORDER BY startDate DESC LIMIT ?",
        [limit]
      );
      for (const tk of tasks) notifications.push(buildTaskNotif(tk));
    } catch { /* ignore tasks table if not present */ }

    sortNotificationsByTime(notifications);
    const unreadCount = notifications.filter(n => n.read === false).length;
    res.json({ forUser: userId, count: notifications.length, unread: unreadCount, items: notifications.slice(0, 50) });
  } catch (err) {
    console.error("notif fetch err:", err);
    res.json({ forUser: userId, count: 0, unread: 0, items: [] });
  }
});

// ─────────────────────────────────────────────────────────
// KIOSK OPS — Admin actions (Calibrate / View Logs / Restart)
// ─────────────────────────────────────────────────────────
app.post('/api/kiosks/:id/calibrate', authenticate, writeLimiter, async (req, res) => {
  try {
    const kioskId = String(req.params.id).toUpperCase();
    const lastPing = 'just now';
    await db.query('UPDATE kiosks SET lastPing = ? WHERE kioskId = ?', [lastPing, kioskId]);
    CacheBust.kiosks();
    res.json({ ok: true, kioskId, calibratedAt: new Date().toISOString(), message: `Calibration job dispatched to ${kioskId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/kiosks/:id/logs', authenticate, async (req, res) => {
  try {
    const kioskId = String(req.params.id).toUpperCase();
    const [tx] = await db.query(
      'SELECT transactionId, userId, weightKg, pointsEarned, timestamp FROM recycling_transactions WHERE kioskId = ? ORDER BY timestamp DESC LIMIT 10',
      [kioskId]
    );
    const logs = [
      { level: 'info', time: new Date(Date.now() - 60000).toISOString(), message: `Kiosk ${kioskId} heartbeat OK` },
      { level: 'info', time: new Date(Date.now() - 5 * 60000).toISOString(), message: 'Scale zero-cal check passed' },
      ...tx.map((t, i) => ({ level: 'info', time: t.timestamp ? new Date(t.timestamp).toISOString() : new Date(Date.now() - (i + 2) * 60000).toISOString(), message: `Tx ${t.transactionId}: ${t.weightKg}kg → +${t.pointsEarned} pts` })),
    ];
    res.json({ ok: true, kioskId, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Kiosk ↔ Mobile session (in-memory; tracks which user is active on a kiosk) ──
const kioskSessions = new Map();
const KIOSK_SESSION_TTL_MS = 120000;

function getActiveKioskSession(userId) {
  const s = kioskSessions.get(userId);
  if (!s) return null;
  if (Date.now() - s.lastPing > KIOSK_SESSION_TTL_MS) {
    kioskSessions.delete(userId);
    return null;
  }
  return s;
}

app.post('/api/kiosk/session/connect', (req, res) => {
  const { userId, userName, kioskId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const session = {
    userId,
    userName: userName || 'User',
    kioskId: kioskId || 'K-01',
    connectedAt: Date.now(),
    lastPing: Date.now(),
  };
  kioskSessions.set(userId, session);
  res.json({ ok: true, connected: true, ...session });
});

app.post('/api/kiosk/session/ping', (req, res) => {
  const { userId } = req.body || {};
  const s = getActiveKioskSession(userId);
  if (!s) return res.json({ connected: false });
  s.lastPing = Date.now();
  res.json({ connected: true, ...s });
});

app.post('/api/kiosk/session/disconnect', (req, res) => {
  const { userId } = req.body || {};
  if (userId) kioskSessions.delete(userId);
  res.json({ ok: true, connected: false });
});

app.get('/api/kiosk/session/:userId', (req, res) => {
  const s = getActiveKioskSession(req.params.userId);
  if (!s) return res.json({ connected: false });
  res.json({ connected: true, kioskId: s.kioskId, userName: s.userName, connectedAt: s.connectedAt, lastPing: s.lastPing });
});

// ── D2 P1: API Gateway fallbacks ─────────────────────────────────────
app.use(apiNotFound);
app.use(errorHandler);

// Start server — bind on 0.0.0.0 so phones on the LAN can reach us via the PC's Wi-Fi IP
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Waste2Goods API Server running at http://localhost:${PORT} (with MySQL/XAMPP — D2 P1 DevSecOps)`);
  console.log(`📡 LAN access: http://<YOUR-PC-WIFI-IP>:${PORT} — find your IP with: ipconfig`);
  console.log(`🔒 Security stack: Helmet | JWT(24h) | bcrypt(10) | Rate-Limit | Zod | Cache | Gateway Logger`);
});
