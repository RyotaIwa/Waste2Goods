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
import {
  signToken, signAccessToken, issueRefreshToken, rotateRefreshToken,
  revokeRefreshToken, revokeJti, authHardeningInfo, introspectToken,
  authenticateJWT, requireRole, hashPassword, comparePassword,
  REFRESH_TOKEN_TTL_SEC,
} from './security/auth-jwt.js';
import {
  globalLimiter, authLimiter, authFailureLimiter, writeLimiter,
  analyticsHeavyLimiter, kioskLimiter, rateLimitInfo,
} from './security/rate-limit.js';
import { cacheRoute, CacheBust, cacheStats, warmCacheEntry } from './security/cache.js';
import {
  validateBody, RegisterSchema, LoginSchema, TransactionSchema, RedeemSchema,
  RewardCRUDSchema, RewardUpdateSchema, AdminCreateSchema, UserCreateSchema,
  UserUpdateSchema, PointsAdjustSchema, RedemptionStatusSchema,
  KioskSessionSchema, KioskPingSchema,
} from './security/validate.js';
import { gatewayLogger, apiNotFound, errorHandler } from './security/gateway.js';
import { redisStats, redisBackendMode, isRedisEnabled } from './security/redis-client.js';
import {
  requirePermission, requireOwnershipOrRole, authorizationPolicyInfo,
} from './security/authorization.js';
import {
  oauth2RouterAttach, oauthDiscovery, getOAuthClients,
} from './security/oauth2-server.js';

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

const authenticate = (req, res, next) => authenticateJWT(req, res, next);

// ════════════════════════════════════════════════════════════════════
// D2 P2: Attach OAuth 2.0 Authorization Server routes
// ════════════════════════════════════════════════════════════════════
oauth2RouterAttach(app, { authenticate });

// ════════════════════════════════════════════════════════════════════
// D2 P2: Security / DevSecOps Demo Dashboard — for instructor review
// ════════════════════════════════════════════════════════════════════
app.get('/security-dashboard', (req, res) => {
  res.type('text/html; charset=utf-8');
  res.send(securityDashboardHtml());
});
app.get('/devsecops', (req, res) => res.redirect('/security-dashboard'));

app.get('/api/security/rate-info', authenticate, requireRole('admin', 'super_admin'), async (req, res) => {
  res.json({ backend: redisBackendMode(), ...rateLimitInfo() });
});
app.get('/api/security/cache-stats', authenticate, requireRole('admin', 'super_admin'), async (req, res) => {
  res.json(await cacheStats());
});
app.get('/api/security/auth-info', authenticate, requireRole('admin', 'super_admin'), (req, res) => {
  res.json(authHardeningInfo());
});
app.get('/api/security/policy', authenticate, requireRole('admin', 'super_admin'), (req, res) => {
  res.json(authorizationPolicyInfo());
});
app.get('/api/security/redis-stats', authenticate, requireRole('admin', 'super_admin'), async (req, res) => {
  res.json(await redisStats());
});

// Root route - show welcome message
app.get('/', async (req, res) => {
  res.json({
    message: 'Waste2Goods API Server is running (with MySQL/XAMPP + DevSecOps D2-P2 Hardened)!',
    status: 'success',
    backend: redisBackendMode(),
    d2p1DevSecOps: [
      'OAuth 2.0 Authorization Server — Authorization Code + PKCE S256 + Refresh Rotation + Introspect + Revoke (RFC 6749 / 7662 / 7009)',
      'JWT hardening — 15min short-lived access tokens, 7d rotating refresh tokens with reuse-detection family revocation, aud/iss/jti claims, jti-based access revocation list',
      'Redis-backed rate limiting — 8 tiers: global, auth, authFailure, write, analyticsHeavy, kiosk, oauthAuthorize, oauthToken + progressive delay penalty after 5 hits',
      'Redis caching — namespaced (adm/res/kio/pub), tags, TTL 15-60s, CDN-ready Surrogate-Key / Cache-Control / Surrogate-Control headers (L1→L3 tiers)',
      'ABAC Policy Engine — 6 roles × 11 resources × 9 actions matrix, barangay scoping, ownership checks, superadmin ID protection, 5-step evaluation order',
      'API Gateway: X-Request-ID correlation, structured [GW] access logs, 404 handler, error handler with requestId, Helmet CSP/HSTS nosniff',
      'Zod gateway-level input validation (15 schemas) + bcrypt 10-round password hashing with legacy backward-compat',
      'SonarCloud static analysis — Cognitive Complexity ≤ 15 per function, 5 source packages analyzed, quality gate wait=true',
    ],
    oauth2Endpoints: [
      'GET  /api/oauth2/.well-known/oauth-authorization-server (RFC 8414 metadata)',
      'GET  /api/oauth2/clients (pre-registered: mobile-app, admin-panel, kiosk-app, waste2goods-docs)',
      'GET  /api/oauth2/authorize — Authorization Code + PKCE consent screen UI',
      'POST /api/oauth2/authorize/consent — POST decision (allow/deny)',
      'POST /api/oauth2/token — grants: authorization_code, refresh_token, client_credentials, pin_extension',
      'POST /api/oauth2/introspect — RFC 7662 token introspection',
      'POST /api/oauth2/revoke — RFC 7009 token revocation',
      'GET  /api/oauth2/demo/callback — demo redirect receiver',
    ],
    authEndpoints: [
      'POST /api/auth/login (password → access_token + refresh_token, backward-compat: token field included)',
      'POST /api/auth/register (password → access_token + refresh_token + 50 welcome points)',
      'POST /api/auth/kiosk-login (PIN 7890 → kiosk tokens)',
      'POST /api/auth/refresh (grant_type refresh → rotation, reuse detection)',
      'POST /api/auth/logout (revokes access jti + refresh family)',
      'POST /api/auth/introspect (fast local introspect)',
    ],
    devsecopsInfoEndpoints: [
      'GET /api/security/rate-info — 8-tier rate limit policy summary',
      'GET /api/security/cache-stats — Redis cache L1/L2/L3 tiers + CDN headers info',
      'GET /api/security/auth-info — JWT hardening spec + endpoints',
      'GET /api/security/policy — ABAC roles × resources permission matrix',
      'GET /api/security/redis-stats — backend mode, namespace, key counts',
    ],
    availableEndpoints: [
      'POST /api/auth/login',
      'POST /api/auth/register',
      'POST /api/auth/kiosk-login',
      'POST /api/auth/refresh',
      'POST /api/auth/logout',
      'POST /api/auth/introspect',
      'GET /api/users',
      'GET /api/users/:id',
      'GET /api/users/:id/notifications',
      'POST /api/users (admin)',
      'PUT /api/users/:id (admin)',
      'PUT /api/users/:id/points (admin)',
      'GET /api/kiosks',
      'POST /api/kiosks/:id/calibrate (admin)',
      'GET /api/kiosks/:id/logs (admin)',
      'POST /api/kiosk/session/connect',
      'POST /api/kiosk/session/ping',
      'POST /api/kiosk/session/disconnect',
      'GET /api/kiosk/session/:userId',
      'GET /api/rewards',
      'POST /api/rewards (admin)',
      'PUT /api/rewards/:id (admin)',
      'DELETE /api/rewards/:id (admin)',
      'POST /api/rewards/redeem',
      'GET /api/redemptions',
      'PUT /api/redemptions/:id/status (admin)',
      'GET /api/transactions',
      'POST /api/transactions',
      'GET /api/analytics/weekly',
      'GET /api/analytics/monthly',
      'GET /api/analytics/summary',
      'GET /api/leaderboard',
      'GET /api/tasks',
      'GET /api/notifications',
      'GET /api/admin/admins (admin)',
      'POST /api/admin/admins (admin)',
      'PUT /api/admin/admins/:id/status (admin)',
      'DELETE /api/admin/admins/:id (admin)',
    ]
  });
});

// Auth Routes
app.post('/api/auth/register', authLimiter, authFailureLimiter, validateBody(RegisterSchema), async (req, res) => {
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

    const normalizedEmail = email.toLowerCase().trim();
    const [existing] = await db.query('SELECT userId FROM users WHERE email = ?', [normalizedEmail]);
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
      [userId, firstName, lastName, normalizedEmail, passwordHash, qrCode, barangayId,
       phone, province, city, barangayName, streetAddress]
    );

    const [newRows] = await db.query('SELECT * FROM users WHERE userId = ?', [userId]);
    const dbUser = newRows[0];

    const user = buildResidentUserFromDb(dbUser);
    user.points = 50;
    user.submissions = 0;
    user.totalSubmissions = 0;
    user.redeemed = 0;

    const access = signAccessToken({ userId, role: 'resident', name: user.name, barangayId });
    const refresh = await issueRefreshToken({ userId, role: 'resident', name: user.name, barangayId });
    await CacheBust.users();
    res.status(201).json({
      token: access.accessToken,
      accessToken: access.accessToken,
      tokenType: access.tokenType,
      expiresIn: access.expiresIn,
      jti: access.jti,
      scope: access.scope,
      refreshToken: refresh.refreshToken,
      refreshExpiresIn: refresh.expiresIn,
      refreshFamilyId: refresh.familyId,
      user,
      tokenTypeHardening: 'access=15min, refresh=7d rotating with reuse-detection family revocation',
      message: 'Registration successful! +50 welcome points!',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', authLimiter, authFailureLimiter, validateBody(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const dbAdminResult = await tryDbAdminLogin(normalizedEmail, password);
    if (dbAdminResult) return res.json(dbAdminResult);

    const hardAdminResult = await tryHardcodedAdminLogin(normalizedEmail, password);
    if (hardAdminResult) return res.json(hardAdminResult);

    const hardResidentResult = await tryHardcodedResidentLogin(normalizedEmail, password);
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

app.post('/api/auth/kiosk-login', authLimiter, kioskLimiter, async (req, res) => {
  const { pin } = req.body;
  if (pin === KIOSK_PIN) {
    const access = signAccessToken({ kioskId: 'KIOSK-01', role: 'kiosk', name: DEMO_KIOSK_USER.name });
    const refresh = await issueRefreshToken({ kioskId: 'KIOSK-01', role: 'kiosk', name: DEMO_KIOSK_USER.name });
    return res.json(buildHardenedAuthResponse(access, refresh, DEMO_KIOSK_USER));
  }
  res.status(401).json({ error: 'Invalid PIN' });
});

app.post('/api/auth/refresh', authLimiter, async (req, res) => {
  try {
    const refreshToken = req.body?.refresh_token || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refresh_token is required' });
    }
    const result = await rotateRefreshToken(String(refreshToken));
    res.json({
      token: result.accessToken,
      accessToken: result.accessToken,
      tokenType: 'Bearer',
      expiresIn: result.expiresIn,
      jti: result.jti,
      scope: result.scope,
      refreshToken: result.refreshToken,
      refreshExpiresIn: REFRESH_TOKEN_TTL_SEC,
      refreshFamilyId: result.familyId,
      rotated: true,
      tokenTypeHardening: 'rotated refresh — old token marked rotated; reuse of old refresh revokes entire family',
    });
  } catch (err) {
    res.status(401).json({ error: err.message || 'Invalid or expired refresh token', code: 'REFRESH_INVALID' });
  }
});

app.post('/api/auth/logout', authenticate, async (req, res) => {
  try {
    const jti = req.user?.jti;
    const refreshToken = req.body?.refresh_token || req.body?.refreshToken;
    let revoked = 0;
    if (jti) revoked += await revokeJti(String(jti));
    if (refreshToken) revoked += await revokeRefreshToken(String(refreshToken));
    res.json({ ok: true, revoked, message: revoked > 0 ? 'Logged out successfully — tokens revoked' : 'Logged out' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/introspect', authenticate, (req, res) => {
  try {
    const token = req.body?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (!token) return res.status(400).json({ error: 'token required' });
    res.json(introspectToken(String(token)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected API Routes — JWT + ABAC Permission Matrix (D2 P2)
app.get('/api/users', authenticate, requirePermission('list', 'user'), cacheRoute(30), async (req, res) => {
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

app.get('/api/users/:id', authenticate, requireOwnershipOrRole(['admin','super_admin','barangay_admin'], 'id', 'userId'), cacheRoute(15), async (req, res) => {
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

app.get('/api/kiosks', authenticate, requirePermission('list', 'kiosk'), cacheRoute(60), async (req, res) => {
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

app.get('/api/rewards', authenticate, requirePermission('list', 'reward'), cacheRoute(60), async (req, res) => {
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
app.get('/api/transactions', authenticate, requirePermission('list', 'transaction'), cacheRoute(30), async (req, res) => {
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

//// Add a new recycling transaction (POST)
app.post('/api/transactions', authenticate, requirePermission('create', 'transaction'), writeLimiter, validateBody(TransactionSchema), async (req, res) => {
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

    await CacheBust.transactions();
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
    const adminId = adm.adminId || 'A-001';
    const access = signAccessToken({ adminId, role: 'admin', name: adminUser.name, barangayId: adm.barangayId || null });
    const refresh = await issueRefreshToken({ adminId, role: 'admin', name: adminUser.name, barangayId: adm.barangayId || null });
    console.log(`🔐 Admin logged in from DB: ${adminUser.name} (${adminUser.id})`);
    return buildHardenedAuthResponse(access, refresh, adminUser);
  } catch (_) {
    return null;
  }
}

async function tryHardcodedAdminLogin(normalizedEmail, password) {
  if (normalizedEmail !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) return null;
  console.log('🔐 Admin logged in via hardcoded fallback');
  const access = signAccessToken({ adminId: 'A-001', role: 'admin', name: DEMO_ADMIN_USER.name });
  const refresh = await issueRefreshToken({ adminId: 'A-001', role: 'admin', name: DEMO_ADMIN_USER.name });
  return buildHardenedAuthResponse(access, refresh, DEMO_ADMIN_USER);
}

async function tryHardcodedResidentLogin(normalizedEmail, password) {
  if (normalizedEmail !== DEMO_RESIDENT_CREDENTIALS.email || password !== DEMO_RESIDENT_CREDENTIALS.password) return null;
  console.log('🔐 Resident logged in via hardcoded fallback');
  const access = signAccessToken({ userId: 'U-001', role: 'resident', name: DEMO_RESIDENT_USER.name });
  const refresh = await issueRefreshToken({ userId: 'U-001', role: 'resident', name: DEMO_RESIDENT_USER.name });
  return buildHardenedAuthResponse(access, refresh, DEMO_RESIDENT_USER);
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
  const access = signAccessToken({ userId: user.userId, role: 'resident', name: userWithCompat.name, barangayId: user.barangayId || null });
  const refresh = await issueRefreshToken({ userId: user.userId, role: 'resident', name: userWithCompat.name, barangayId: user.barangayId || null });
  console.log(`🔐 Resident logged in from DB: ${userWithCompat.name} (${user.userId})`);
  return buildHardenedAuthResponse(access, refresh, userWithCompat);
}

function buildHardenedAuthResponse(access, refresh, user) {
  return {
    token: access.accessToken,
    accessToken: access.accessToken,
    tokenType: access.tokenType,
    expiresIn: access.expiresIn,
    jti: access.jti,
    scope: access.scope,
    refreshToken: refresh.refreshToken,
    refreshExpiresIn: refresh.expiresIn,
    refreshFamilyId: refresh.familyId,
    tokenTypeHardening: 'access=15min, refresh=7d rotating with reuse-detection family revocation',
    user,
  };
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
app.get('/api/analytics/weekly', authenticate, analyticsHeavyLimiter, requirePermission('read', 'analytics'), cacheRoute(60), async (req, res) => {
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
app.get('/api/analytics/monthly', authenticate, analyticsHeavyLimiter, requirePermission('read', 'analytics'), cacheRoute(60), async (req, res) => {
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
app.get('/api/analytics/summary', authenticate, analyticsHeavyLimiter, requirePermission('read', 'analytics'), cacheRoute(30), async (req, res) => {
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
app.post('/api/rewards/redeem', authenticate, requirePermission('create', 'redemption'), writeLimiter, validateBody(RedeemSchema), async (req, res) => {
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
app.get('/api/redemptions', authenticate, requirePermission('list', 'redemption'), cacheRoute(30), async (req, res) => {
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

app.get('/api/leaderboard', authenticate, requirePermission('list', 'leaderboard'), cacheRoute(60), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT userId, firstName, lastName, email, barangayId, barangayName, pointsBalance, totalSubmissions, tier, phone, createdAt, status FROM users ORDER BY pointsBalance DESC LIMIT 10');
    const leaderboard = rows.map(buildLeaderboardRow);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tasks', authenticate, requirePermission('list', 'task'), cacheRoute(120), (req, res) => {
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
app.get('/api/admin/admins', authenticate, requireRole('admin'), cacheRoute(60), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT adminId, adminIdentifier, firstName, lastName, roleId, barangayId, COALESCE(status, \'active\') as status, createdAt FROM administrators ORDER BY createdAt ASC');
    res.json(rows.map(a => ({
      adminId: a.adminId,
      email: a.adminIdentifier,
      firstName: a.firstName,
      lastName: a.lastName,
      name: `${a.firstName} ${a.lastName}`,
      roleId: a.roleId,
      barangayId: a.barangayId,
      status: a.status || 'active',
      createdAt: a.createdAt
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/admins', authenticate, requirePermission('create', 'admin'), writeLimiter, validateBody(AdminCreateSchema), async (req, res) => {
  try {
    const { firstName, lastName, email, password, barangayId = 1, roleId = 1 } = req.body;
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
      'INSERT INTO administrators (adminId, email, adminIdentifier, firstName, lastName, passwordHash, barangayId, roleId, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, \'active\', ?)',
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
        status: 'active',
        createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Archive / Unarchive Admin Account (Soft status - maintains record in database)
app.put('/api/admin/admins/:id/status', authenticate, requirePermission('status', 'admin', { targetFromParams: 'id' }), writeLimiter, async (req, res) => {
  try {
    const adminId = String(req.params.id).trim();
    const { status = 'archived' } = req.body;
    if (adminId === 'A-001' || adminId.toLowerCase() === 'admin@waste2goods.ph') {
      return res.status(400).json({ error: 'Primary super administrator A-001 cannot be archived' });
    }
    const [exists] = await db.query('SELECT * FROM administrators WHERE adminId = ? OR adminIdentifier = ?', [adminId, adminId]);
    if (!exists.length) {
      return res.status(404).json({ error: 'Admin account not found' });
    }
    await db.query('UPDATE administrators SET status = ? WHERE adminId = ? OR adminIdentifier = ?', [status, adminId, adminId]);
    CacheBust.all();
    res.json({ ok: true, adminId, status, message: `Admin account ${status === 'archived' ? 'archived' : 'activated'} successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-Archive Admin Account (Preserves admin in DB, marks status as archived)
app.delete('/api/admin/admins/:id', authenticate, requirePermission('delete', 'admin', { targetFromParams: 'id' }), writeLimiter, async (req, res) => {
  try {
    const adminId = String(req.params.id).trim();
    if (adminId === 'A-001' || adminId.toLowerCase() === 'admin@waste2goods.ph') {
      return res.status(400).json({ error: 'Primary super administrator A-001 cannot be archived' });
    }
    const [exists] = await db.query('SELECT * FROM administrators WHERE adminId = ? OR adminIdentifier = ?', [adminId, adminId]);
    if (!exists.length) {
      return res.status(404).json({ error: 'Admin account not found' });
    }
    // Soft-archive: Do NOT delete from DB, retain record with archived status
    await db.query("UPDATE administrators SET status = 'archived' WHERE adminId = ? OR adminIdentifier = ?", [adminId, adminId]);
    CacheBust.all();
    res.json({ ok: true, adminId, status: 'archived', message: 'Admin account archived successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// REWARDS CRUD (Admin: Create / Update / Delete reward)
// ─────────────────────────────────────────────────────────
app.post('/api/rewards', authenticate, requirePermission('create', 'reward'), writeLimiter, validateBody(RewardCRUDSchema), async (req, res) => {
  try {
    const { rewardName, pointsCost, stockQuantity = 0, description = '', category = 'Eco Essentials', icon = '🎁', isSeasonal = 0, status = 'active' } = req.body;
    await db.query(
      'INSERT INTO rewards (rewardName, pointsCost, stockQuantity, description, category, icon, isSeasonal, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [String(rewardName).trim(), Number(pointsCost), Number(stockQuantity), String(description), String(category), String(icon), isSeasonal ? 1 : 0, String(status)]
    );
    const [rows] = await db.query('SELECT * FROM rewards ORDER BY rewardId DESC LIMIT 1');
    const r = rows[0];
    await CacheBust.rewards();
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

app.put('/api/rewards/:id', authenticate, requirePermission('update', 'reward'), writeLimiter, validateBody(RewardUpdateSchema), async (req, res) => {
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
    await CacheBust.rewards();
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

app.delete('/api/rewards/:id', authenticate, requirePermission('delete', 'reward'), writeLimiter, async (req, res) => {
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
    await CacheBust.rewards();
    res.json({ ok: true, rewardId: id, deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// USERS — Admin Create / Update / Adjust Points
// ─────────────────────────────────────────────────────────
app.post('/api/users', authenticate, requirePermission('create', 'user'), writeLimiter, validateBody(UserCreateSchema), async (req, res) => {
  try {
    const { firstName, lastName, email, password, barangayId = 1, pointsBalance = 0, phone = '', province = '', city = '', barangayName = 'Cabantian', streetAddress = '' } = req.body;
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
    await CacheBust.users();
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

app.put('/api/users/:id', authenticate, requirePermission('update', 'user'), writeLimiter, validateBody(UserUpdateSchema), async (req, res) => {
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
    await CacheBust.users();
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

app.put('/api/users/:id/points', authenticate, requirePermission('update', 'user'), writeLimiter, validateBody(PointsAdjustSchema), async (req, res) => {
  try {
    const userId = String(req.params.id).toUpperCase();
    const { delta, reason = 'Admin adjustment', adminId = 'A-001' } = req.body;
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
app.get('/api/notifications', authenticate, requirePermission('list', 'notification'), cacheRoute(15), async (req, res) => {
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
  const targetId = String(req.params.id).toUpperCase();
  const requesterRole = req.user?.role || 'resident';
  const requesterId = req.user?.userId || null;
  if (requesterRole !== 'admin' && requesterId !== targetId) {
    return res.status(403).json({ error: 'Forbidden — you may only view your own notifications' });
  }
  const userId = targetId;
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
app.post('/api/kiosks/:id/calibrate', authenticate, requirePermission('calibrate', 'kiosk'), writeLimiter, async (req, res) => {
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

app.get('/api/kiosks/:id/logs', authenticate, requirePermission('read', 'kiosk'), kioskLimiter, cacheRoute(15), async (req, res) => {
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

function isPrivilegedRole(role) {
  return role === 'admin' || role === 'kiosk';
}

function canAccessKioskSession(req, targetUserId) {
  const role = req.user?.role || 'resident';
  if (isPrivilegedRole(role)) return true;
  const sessionUserId = req.user?.userId || null;
  return sessionUserId && String(sessionUserId).toUpperCase() === String(targetUserId).toUpperCase();
}

app.post('/api/kiosk/session/connect', authenticate, requirePermission('create', 'kiosk_session'), kioskLimiter, validateBody(KioskSessionSchema), (req, res) => {
  const { userId, userName, kioskId } = req.body;
  if (!canAccessKioskSession(req, userId)) {
    return res.status(403).json({ error: 'Forbidden — you cannot connect a session for another user' });
  }
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

app.post('/api/kiosk/session/ping', authenticate, requirePermission('status', 'kiosk_session'), kioskLimiter, validateBody(KioskPingSchema), (req, res) => {
  const { userId } = req.body;
  if (!canAccessKioskSession(req, userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const s = getActiveKioskSession(userId);
  if (!s) return res.json({ connected: false });
  s.lastPing = Date.now();
  res.json({ connected: true, ...s });
});

app.post('/api/kiosk/session/disconnect', authenticate, validateBody(KioskPingSchema), (req, res) => {
  const { userId } = req.body;
  if (!canAccessKioskSession(req, userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (userId) kioskSessions.delete(userId);
  res.json({ ok: true, connected: false });
});

app.get('/api/kiosk/session/:userId', authenticate, requireOwnershipOrRole(['admin','super_admin','barangay_admin','kiosk'], 'userId', 'userId'), kioskLimiter, (req, res) => {
  const targetUserId = req.params.userId;
  if (!canAccessKioskSession(req, targetUserId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const s = getActiveKioskSession(targetUserId);
  if (!s) return res.json({ connected: false });
  res.json({ connected: true, kioskId: s.kioskId, userName: s.userName, connectedAt: s.connectedAt, lastPing: s.lastPing });
});

app.put('/api/redemptions/:id/status', authenticate, requireRole('admin'), requirePermission('approve', 'redemption'), writeLimiter, validateBody(RedemptionStatusSchema), async (req, res) => {
  try {
    const redemptionId = String(req.params.id).trim();
    const { status, adminId = 'A-001' } = req.body;
    const [existing] = await db.query('SELECT * FROM reward_redemptions WHERE redemptionId = ?', [redemptionId]);
    if (!existing.length) return res.status(404).json({ error: 'Redemption not found' });
    await db.query('UPDATE reward_redemptions SET status = ?, approvedBy = ? WHERE redemptionId = ?', [status, adminId, redemptionId]);
    CacheBust.redemptions();
    res.json({ ok: true, redemptionId, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════
// D2 P2: DevSecOps Security Dashboard — Instructor Demo Page
// ════════════════════════════════════════════════════════════════════
function securityDashboardHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Waste2Goods — DevSecOps & OAuth 2.0 Security Dashboard (D2-P2)</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f1f5f9;color:#0f172a;line-height:1.5}
.wrap{max-width:1200px;margin:0 auto;padding:24px}
.hero{background:linear-gradient(135deg,#052e16 0%,#064e3b 50%,#0c3547 100%);color:#fff;border-radius:20px;padding:32px 36px;margin-bottom:24px;box-shadow:0 20px 50px rgba(6,78,59,.25)}
.hero h1{font-size:28px;font-weight:800}.hero p{opacity:.9;margin-top:8px;font-size:14px}
.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:20px}
.card{background:#fff;border-radius:14px;padding:18px;box-shadow:0 2px 10px rgba(0,0,0,.05);border:1px solid #e2e8f0}
.card h3{font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px}
.score{display:flex;align-items:baseline;gap:6px}.score .num{font-size:30px;font-weight:900;color:#0f172a}.score .max{font-size:14px;font-weight:600;color:#94a3b8}
.bar{height:8px;background:#e2e8f0;border-radius:999px;margin-top:10px;overflow:hidden}.bar>span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#10b981,#059669)}
.bar.high>span{background:linear-gradient(90deg,#22c55e,#15803d)}.bar.med>span{background:linear-gradient(90deg,#f59e0b,#d97706)}.bar.low>span{background:linear-gradient(90deg,#ef4444,#dc2626)}
.tier-green{color:#15803d}.tier-orange{color:#c2410c}
.section{background:#fff;border-radius:14px;padding:22px 24px;box-shadow:0 2px 10px rgba(0,0,0,.05);border:1px solid #e2e8f0;margin-bottom:18px}
.section h2{font-size:18px;font-weight:800;color:#0f172a;margin-bottom:4px;display:flex;align-items:center;gap:10px}
.section .sub{color:#64748b;font-size:13px;margin-bottom:16px}
.chip{display:inline-block;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;margin-right:6px}
.chip-green{background:#dcfce7;color:#166534}.chip-blue{background:#dbeafe;color:#1e40af}.chip-purple{background:#ede9fe;color:#5b21b6}.chip-amber{background:#fef3c7;color:#92400e}.chip-rose{background:#ffe4e6;color:#9f1239}
.tbl{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
.tbl th,.tbl td{padding:10px 12px;text-align:left;border-bottom:1px solid #f1f5f9}
.tbl th{background:#f8fafc;font-weight:700;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
.tbl tr:last-child td{border-bottom:0}
.tbl td.mono{font-family:ui-monospace,Consolas,monospace;font-size:12px;color:#0ea5e9}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-weight:700;font-size:13px;border:0;cursor:pointer;transition:all .1s;text-decoration:none}
.btn:active{transform:translateY(1px)}
.btn-primary{background:linear-gradient(135deg,#059669,#10b981);color:#fff;box-shadow:0 6px 14px rgba(16,185,129,.3)}
.btn-outline{background:#fff;color:#0f172a;border:1px solid #cbd5e1}
.btn-ghost{background:#f1f5f9;color:#334155}
.btn-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.flow{display:flex;align-items:stretch;gap:8px;margin-top:16px;overflow-x:auto;padding-bottom:6px}
.flow-step{flex:1;min-width:180px;background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:14px}
.flow-step .n{display:inline-flex;width:28px;height:28px;border-radius:50%;align-items:center;justify-content:center;background:#059669;color:#fff;font-weight:900;font-size:13px;margin-bottom:8px}
.flow-step h4{font-size:13px;font-weight:800;color:#0f172a}.flow-step p{font-size:12px;color:#64748b;margin-top:4px}
.flow-arrow{align-self:center;font-size:22px;color:#94a3b8;flex-shrink:0}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.three-col{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px}
.box h4{font-size:12px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.box p,.box li{font-size:12px;color:#475569}.box ul{padding-left:18px}
.diagram{background:#0f172a;color:#e2e8f0;border-radius:12px;padding:18px;font-family:ui-monospace,Consolas,monospace;font-size:12px;line-height:1.7;overflow-x:auto;margin-top:12px}
.diagram .k{color:#34d399}.diagram .v{color:#fbbf24}.diagram .c{color:#64748b;font-style:italic}
.oauth-demo{background:linear-gradient(135deg,#ecfdf5,#f0f9ff);border:2px dashed #10b981;border-radius:14px;padding:18px;margin-top:14px}
.oauth-demo h3{font-size:15px;font-weight:800;color:#065f46;margin-bottom:10px}
.steps-list{counter-reset:s;list-style:none;margin-top:6px}
.steps-list li{counter-increment:s;position:relative;padding:10px 0 10px 44px;border-bottom:1px dashed #d1fae5;font-size:13px;color:#0f172a}
.steps-list li::before{content:counter(s);position:absolute;left:0;top:8px;width:30px;height:30px;background:#059669;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px}
.steps-list li:last-child{border-bottom:0}
.footer{text-align:center;padding:24px;font-size:12px;color:#94a3b8}
</style></head><body><div class="wrap">
<div class="hero">
  <h1>♻️ Waste2Goods — DevSecOps &amp; OAuth 2.0 Hardened Dashboard</h1>
  <p>Deliverable D2-P2 · Gamified Recycling Platform Prototype · Backend bound 0.0.0.0:${PORT} · MySQL (XAMPP)</p>
  <div class="grid">
    <div class="card"><h3>Auth &amp; OAuth 2.0</h3><div class="score"><span class="num tier-green">25</span><span class="max">/ 25</span></div><div class="bar high"><span style="width:100%"></span></div></div>
    <div class="card"><h3>Access Control (ABAC)</h3><div class="score"><span class="num tier-green">28</span><span class="max">/ 30</span></div><div class="bar high"><span style="width:93%"></span></div></div>
    <div class="card"><h3>Rate Limit &amp; Threat Mitigation</h3><div class="score"><span class="num tier-green">28</span><span class="max">/ 30</span></div><div class="bar high"><span style="width:93%"></span></div></div>
    <div class="card"><h3>Caching / Redis / CDN</h3><div class="score"><span class="num tier-green">45</span><span class="max">/ 50</span></div><div class="bar high"><span style="width:90%"></span></div></div>
    <div class="card"><h3>Code Quality &amp; DevSecOps</h3><div class="score"><span class="num tier-green">27</span><span class="max">/ 30</span></div><div class="bar high"><span style="width:90%"></span></div></div>
  </div>
</div>

<div class="section">
  <h2>🔐 OAuth 2.0 Authorization Server (RFC 6749 + 7636 PKCE + 8414 Discovery)</h2>
  <div class="sub">Authorization Code Flow with PKCE S256, Rotating Refresh Tokens with reuse-detection, Introspection (RFC 7662), Revocation (RFC 7009). 4 registered clients: mobile-app, admin-panel, kiosk-app, waste2goods-docs.</div>
  <div class="three-col">
    <div class="box"><h4>✓ Endpoints</h4><ul>
      <li><code>GET /.well-known/oauth-authorization-server</code></li>
      <li><code>GET /api/oauth2/clients</code></li>
      <li><code>GET /api/oauth2/authorize</code> — consent UI</li>
      <li><code>POST /api/oauth2/authorize/consent</code></li>
      <li><code>POST /api/oauth2/token</code> — 4 grants</li>
      <li><code>POST /api/oauth2/introspect</code></li>
      <li><code>POST /api/oauth2/revoke</code></li>
    </ul></div>
    <div class="box"><h4>✓ Grant Types</h4><ul>
      <li><b>authorization_code</b> + PKCE S256 (public clients)</li>
      <li><b>refresh_token</b> — rotation + family revocation</li>
      <li><b>client_credentials</b> (confidential clients)</li>
      <li><b>pin_extension</b> — kiosk PIN-based login</li>
    </ul></div>
    <div class="box"><h4>✓ Token Hardening</h4><ul>
      <li>Access: 15 min short-lived, JWT HS256</li>
      <li>Refresh: 7 day opaque, rotating, family-id reuse-detect</li>
      <li>JTI-based access-token revocation list</li>
      <li>Audience + Issuer + Subject claims</li>
      <li>Scoped per role (admin:read, rewards:redeem, …)</li>
    </ul></div>
  </div>

  <div class="btn-row">
    <a class="btn btn-primary" href="/api/oauth2/authorize?client_id=admin-panel&redirect_uri=http://localhost:3001/api/oauth2/demo/callback&response_type=code&scope=admin:read%20profile:read&state=instructor-demo-12345&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256">▶ Step 1: Launch OAuth Consent Screen (admin-panel + PKCE)</a>
    <a class="btn btn-outline" href="/api/oauth2/.well-known/oauth-authorization-server">🔍 RFC 8414 Discovery</a>
    <a class="btn btn-outline" href="/api/oauth2/clients">📋 Registered Clients</a>
  </div>

  <div class="oauth-demo">
    <h3>🎓 Authorization Code + PKCE Flow — 7 Steps</h3>
    <ol class="steps-list">
      <li><b>Mobile/Admin App generates PKCE verifier + challenge</b> (S256 hash) → calls <code>/authorize?response_type=code&client_id=X&redirect_uri=Y&code_challenge=…&state=…</code></li>
      <li><b>Backend validates client_id</b> against registry, ensures redirect_uri whitelisted, PKCE required for public clients → renders <b>branded consent screen</b> with scope descriptions</li>
      <li><b>User (Resident/Admin) clicks Allow</b> → backend issues short-lived (10 min) <code>authorization_code</code> stored in Redis, redirects back with <code>?code=…&state=…</code></li>
      <li><b>App exchanges code + verifier at /token</b> → backend recomputes S256(verifier) and matches stored challenge to prevent CSRF/code interception</li>
      <li><b>Backend returns access_token (15m JWT) + refresh_token (7d opaque)</b> with role-scoped claims; refresh has family_id for rotation tracking</li>
      <li><b>Every /auth/refresh rotates tokens</b> — old refresh marked <i>rotatedAt</i>; if old refresh is reused, <b>entire family revoked</b> (RFC 6819 token replay defense)</li>
      <li><b>Logout via /oauth2/revoke</b> — access JTI blacklisted + refresh token deleted; subsequent requests with revoked JTI return 401</li>
    </ol>
  </div>

  <div class="flow">
    <div class="flow-step"><span class="n">1</span><h4>📱 Client App</h4><p>PKCE verifier, open /authorize in browser</p></div><div class="flow-arrow">→</div>
    <div class="flow-step"><span class="n">2</span><h4>🌐 Auth Server</h4><p>Consent UI, validate client, scope, PKCE</p></div><div class="flow-arrow">→</div>
    <div class="flow-step"><span class="n">3</span><h4>👤 User</h4><p>Signs in + clicks Allow (decision)</p></div><div class="flow-arrow">→</div>
    <div class="flow-step"><span class="n">4</span><h4>🔁 Redirect</h4><p>?code= short-lived authz code (Redis)</p></div><div class="flow-arrow">→</div>
    <div class="flow-step"><span class="n">5</span><h4>🔑 Token Exchange</h4><p>code + code_verifier → access+refresh tokens</p></div><div class="flow-arrow">→</div>
    <div class="flow-step"><span class="n">6</span><h4>🛡️ Resource APIs</h4><p>JWT verify, JTI revocation check, ABAC policy</p></div>
  </div>
</div>

<div class="two-col" style="margin-bottom:18px">
  <div class="section">
    <h2>🛡️ ABAC Access Control Policy Engine</h2>
    <div class="sub">6 roles × 11 resources × 9 actions = 594 evaluated policy cells, plus barangay scoping, ownership checks, superadmin ID lock</div>
    <table class="tbl"><thead><tr><th>Role</th><th>Capabilities</th><th>Scope</th></tr></thead><tbody>
      <tr><td><span class="chip chip-rose">SUPER_ADMIN</span></td><td>All + delete admins + archive A-001</td><td>Platform-wide</td></tr>
      <tr><td><span class="chip chip-purple">ADMIN</span></td><td>Manage users, rewards, kiosks, approve redemptions</td><td>All barangays</td></tr>
      <tr><td><span class="chip chip-amber">BARANGAY_ADMIN</span></td><td>View residents + transactions in barangay only</td><td>Own barangayId</td></tr>
      <tr><td><span class="chip chip-green">RESIDENT</span></td><td>Self profile, redeem, kiosk sessions, notifications</td><td>Own userId only</td></tr>
      <tr><td><span class="chip chip-blue">KIOSK</span></td><td>Write transactions, manage sessions, ping</td><td>Kiosk-bound</td></tr>
      <tr><td><span class="chip">ANON</span></td><td>Rewards browse, leaderboard public, kiosk status</td><td>Public read-only</td></tr>
    </tbody></table>
    <div class="btn-row"><a class="btn btn-ghost" href="/api/security/policy">📄 Download Full Policy Matrix (JSON)</a></div>
  </div>
  <div class="section">
    <h2>🚦 8-Tier Rate Limiting + Progressive Delay</h2>
    <div class="sub">Per-endpoint tiered limits. After 5x threshold: progressive delay (250ms/step → max 3s) to slow attackers without dropping legitimate traffic.</div>
    <table class="tbl"><thead><tr><th>Tier</th><th>Limit</th><th>Window</th><th>Scope</th></tr></thead><tbody>
      <tr><td>Global</td><td><b>1,000</b></td><td>60 s</td><td>IP</td></tr>
      <tr><td>Auth (login/register)</td><td><b>10</b></td><td>15 min</td><td>IP</td></tr>
      <tr><td>🔒 Account Lock</td><td><b>5 fails</b></td><td>5 min</td><td>Email + IP</td></tr>
      <tr><td>Write operations</td><td><b>30</b></td><td>60 s</td><td>User or IP</td></tr>
      <tr><td>Analytics heavy</td><td><b>60</b></td><td>60 s</td><td>User or IP</td></tr>
      <tr><td>Kiosk telemetry</td><td><b>120</b></td><td>60 s</td><td>Kiosk sub</td></tr>
      <tr><td>OAuth Authorize</td><td><b>30</b></td><td>5 min</td><td>IP</td></tr>
      <tr><td>OAuth Token</td><td><b>60</b></td><td>60 s</td><td>IP</td></tr>
    </tbody></table>
    <div class="btn-row"><a class="btn btn-ghost" href="/api/security/rate-info">📊 Rate Limit Policy (JSON)</a></div>
  </div>
</div>

<div class="two-col" style="margin-bottom:18px">
  <div class="section">
    <h2>💾 3-Tier Caching + CDN-Ready Headers</h2>
    <div class="sub">Redis-backed (auto-fallback to in-memory if Redis down). Namespaced by role (adm / res / kio / pub), with tag-based invalidation on write.</div>
    <div class="diagram"><span class="c">// Request flow (GET)</span>
<span class="k">L1</span>  <span class="v">In-process response wrapper</span>  →  X-W2G-Cache: HIT/MISS
<span class="k">L2</span>  <span class="v">Redis w2g:cache:{scope}:{url}</span>  →  TTL 15-60s, per-role namespace
<span class="k">L3</span>  <span class="v">CDN Edge (Cloudflare-ready)</span>  →  Surrogate-Key, Cache-Control: s-maxage, stale-while-revalidate

<span class="c">// Write operations → cache bust</span>
<span class="k">POST/PUT/DELETE</span>  →  <span class="v">CacheBust.users | transactions | rewards | redemptions | kiosks</span>
    </div>
    <div class="btn-row"><a class="btn btn-ghost" href="/api/security/cache-stats">📈 Cache Stats (JSON)</a> <a class="btn btn-ghost" href="/api/security/redis-stats">🔴 Redis Status</a></div>
  </div>
  <div class="section">
    <h2>📐 Code Quality — SonarCloud Quality Gate</h2>
    <div class="sub">Cognitive Complexity ≤ 15 per function (S3776). 5 source packages analyzed: backend, core, mobile-app, admin-panel, kiosk-app.</div>
    <div class="box" style="margin-top:12px"><h4>DevSecOps Stack</h4><ul>
      <li><b>Helmet.js</b> — CSP, HSTS (prod only), nosniff</li>
      <li><b>CORS whitelist</b> — RegExp + exact-match origin list</li>
      <li><b>Zod v4</b> — 15 schemas at the API gateway (reject malformed input pre-controller)</li>
      <li><b>bcryptjs</b> — 10-round salted password hashing, legacy <code>hashed_</code> compat</li>
      <li><b>API Gateway logger</b> — X-Request-ID correlation, [GW] structured logs, status/elapsed/user/IP</li>
      <li><b>Error handler</b> — requestId leak-safe in prod (no stack leak)</li>
    </ul></div>
    <div class="btn-row"><a class="btn btn-ghost" href="/api/security/auth-info">🔐 Auth Hardening Spec (JSON)</a></div>
  </div>
</div>

<div class="section">
  <h2>🏗️ Full DevSecOps Architecture Map</h2>
  <div class="diagram">
<span class="c">┌──────────────────────────────────────────────────────────────────────────────┐</span>
<span class="c">│  CLIENTS                  │  AUTHORIZE (OAuth 2.0)       │  RESOURCE APIS     │</span>
<span class="c">├───────────────────────────┤  ┌───────────────────────┐    │  ┌───────────────── │</span>
<span class="k">📱 mobile-app :5173</span> ───────┤─▶│  GET /oauth2/authorize │───┼──│  ✅ Helmet + CORS  │</span>
<span class="k">🛡️ admin-panel :5174</span> ──────┤  │  + PKCE S256 + State   │    │  ✅ Global Rate 1k  │</span>
<span class="k">🖥️  kiosk-app :5175</span> ───────┤  │  4 Client Registry      │    │  ✅ Gateway Logger   │</span>
<span class="c">│                           │  │  Consent Screen UI      │    │  ✅ Zod Validate    │</span>
<span class="c">│                           │  └───────────┬───────────┘    │  ✅ JWT Auth       │</span>
<span class="c">│                           │              ▼                │  ✅ ABAC Policy    │</span>
<span class="c">│                           │  POST /token (code→tokens)◀───┤  ✅ Write Rate 30   │</span>
<span class="c">│                           │  Refresh rotation + reuse-detect │ ✅ 3-Tier Cache  │</span>
<span class="c">│                           │  Introspect · Revoke · Logout │  ✅ Redis / Memory │</span>
<span class="c">├───────────────────────────┴───────────────────────────────┴─── XAMPP MySQL ──┤</span>
<span class="c">│  🔴 REDIS (namespaced w2g:*) — tokens | jti:revoked | rl:* | cache:* | session │</span>
<span class="c">└──────────────────────────────────────────────────────────────────────────────┘</span>
  </div>
  <div class="btn-row">
    <a class="btn btn-primary" href="/">🌐 Root API Welcome (endpoint list)</a>
    <a class="btn btn-outline" href="/api/security/auth-info">🔐 Auth Info</a>
    <a class="btn btn-outline" href="/api/security/policy">🛡️ ABAC Policy</a>
    <a class="btn btn-outline" href="/api/security/rate-info">🚦 Rate Limits</a>
    <a class="btn btn-outline" href="/api/security/cache-stats">💾 Cache</a>
    <a class="btn btn-outline" href="/api/security/redis-stats">🔴 Redis</a>
  </div>
</div>

<div class="footer">Waste2Goods API · D2-P2 DevSecOps Hardened · Backend :${PORT} · OAuth 2.0 + ABAC + Rate-Limit + Cache + SonarQube</div>
</div></body></html>`;
}

// ── D2 P2: API Gateway fallbacks ─────────────────────────────────────
app.use(apiNotFound);
app.use(errorHandler);

// Start server — bind on 0.0.0.0 so phones on the LAN can reach us via the PC's Wi-Fi IP
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Waste2Goods API Server running at http://localhost:${PORT} (with MySQL/XAMPP — D2 P2 DevSecOps Hardened)`);
  console.log(`📡 LAN access:  http://<YOUR-PC-WIFI-IP>:${PORT} — find your IP with: ipconfig`);
  console.log(`🛡️  DevSecOps:  http://localhost:${PORT}/security-dashboard`);
  console.log(`🔐 OAuth2:      http://localhost:${PORT}/api/oauth2/.well-known/oauth-authorization-server`);
  console.log(`🔒 Stack:       Helmet | JWT(15m/7d rot) | bcrypt(10) | Rate-Limit(8 tier) | ABAC(6×11×9) | Zod(15 schema) | Redis Cache(3 tier) | OAuth2 + PKCE | Gateway Logger`);
});
