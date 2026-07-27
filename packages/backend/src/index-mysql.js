import express from 'express';
import cors from 'cors';
import db from './db-mysql.js';
import {
  ADMIN_CREDENTIALS,
  KIOSK_PIN,
  DEMO_RESIDENT_CREDENTIALS,
  DEMO_ADMIN_USER,
  DEMO_RESIDENT_USER,
  DEMO_KIOSK_USER
} from '@waste2goods/core';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

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

// Simple middleware to check auth token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  // Accept mock tokens + any dynamic tokens we generate (token_U-XXX_...)
  if (
    ['mock_admin_token_123', 'mock_resident_token_456', 'mock_kiosk_token_789'].includes(token) ||
    token.startsWith('token_U-') ||
    token.startsWith('token_A-')
  ) {
    next();
  } else {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      firstName, lastName, email, password,
      barangayId = 1, phone = '',
      province = '', city = '', barangayName = '',
      streetAddress = ''
    } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Required fields missing (first name, last name, email, password)' });
    }
    if (!province || !city || !barangayName) {
      return res.status(400).json({ error: 'Please select Province, City, and Barangay' });
    }

    // Check if email already exists
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate user ID
    const [countResult] = await db.query('SELECT COUNT(*) as cnt FROM users');
    const userNumber = (countResult[0].cnt || 0) + 1;
    const userId = `U-${String(userNumber).padStart(3, '0')}`;

    // Insert user (with province/city/barangayName/phone/streetAddress columns now present after schema migration)
    const passwordHash = `hashed_${password}`;
    await db.query(
      `INSERT INTO users 
         (userId, firstName, lastName, email, passwordHash, barangayId,
          pointsBalance, totalSubmissions, status, phone, province, city, barangayName, streetAddress)
       VALUES (?, ?, ?, ?, ?, ?, 50, 0, 'active', ?, ?, ?, ?, ?)`,
      [userId, firstName, lastName, email, passwordHash, barangayId,
       phone, province, city, barangayName, streetAddress]
    );

    // Fetch back the newly inserted user to include timestamp/compatibility fields
    const [newRows] = await db.query('SELECT * FROM users WHERE userId = ?', [userId]);
    const dbUser = newRows[0];

    const user = {
      ...dbUser,
      id: userId,
      name: `${firstName} ${lastName}`,
      barangay: barangayName || 'Cabantian',
      points: 50,
      joined: new Date(dbUser.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      submissions: 0,
      redeemed: 0
    };

    const token = `token_${userId}_${Date.now()}`;
    res.status(201).json({ token, user, message: 'Registration successful! +50 welcome points!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // ──────────────────────────────────────────────────────
  // 1. TRY DB-BASED ADMIN LOGIN FIRST (administrators table)
  // ──────────────────────────────────────────────────────
  // This checks against REAL admin rows in the administrators table
  // (inserted by db-mysql.js seed: Juan Reyes A-001, admin@waste2goods.ph)
  try {
    const [adminRows] = await db.query(
      'SELECT * FROM administrators WHERE adminIdentifier = ? OR adminIdentifier = ? LIMIT 1',
      [email, email.toLowerCase().trim()]
    );
    if (adminRows.length > 0) {
      const adm = adminRows[0];
      const expectedAdminHash = `hashed_${password}`;
      // Accept both plain password (dev convenience) and hashed_ prefixed version
      if (password === ADMIN_CREDENTIALS.password ||
          adm.passwordHash === password ||
          adm.passwordHash === expectedAdminHash) {
        const adminUser = {
          id: adm.adminId || `A-${adm.adminIdentifier}`,
          name: `${adm.firstName || 'Juan'} ${adm.lastName || 'Reyes'}`,
          email: adm.adminIdentifier,
          role: 'admin',
          barangay: 'Cabantian',
          roleId: adm.roleId || 1,
          adminId: adm.adminId || null,
        };
        const token = `admin_token_${adm.adminId || 'A001'}_${Date.now()}`;
        console.log(`🔐 Admin logged in from DB: ${adminUser.name} (${adminUser.id})`);
        return res.json({ token, user: adminUser });
      }
    }
  } catch (_) {
    // administrators table may not exist yet; ignore and fall through
  }

  // ──────────────────────────────────────────────────────
  // 2. HARDCODED ADMIN FALLBACK (if DB admin check failed/missing table)
  // ──────────────────────────────────────────────────────
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    console.log('🔐 Admin logged in via hardcoded fallback (administrators table not used)');
    return res.json({ token: 'mock_admin_token_123', user: DEMO_ADMIN_USER });
  }

  // ──────────────────────────────────────────────────────
  // 3. RESIDENT LOGIN (users table - NO demo shortcuts)
  // ──────────────────────────────────────────────────────
  // All residents MUST be registered via the Mobile App Sign-Up first.
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials or user not registered yet. Please sign up first!' });
    }
    const user = rows[0];
    const expectedHash = `hashed_${password}`;
    if (user.passwordHash !== password && user.passwordHash !== expectedHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userWithCompat = {
      ...user,
      id: user.userId,
      name: `${user.firstName} ${user.lastName}`,
      barangay: user.barangayName || 'Cabantian',
      points: user.pointsBalance,
      joined: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      submissions: user.totalSubmissions,
      redeemed: 0
    };

    const token = `token_${user.userId}_${Date.now()}`;
    console.log(`🔐 Resident logged in from DB: ${userWithCompat.name} (${user.userId})`);
    return res.json({ token, user: userWithCompat });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/kiosk-login', (req, res) => {
  const { pin } = req.body;
  if (pin === KIOSK_PIN) {
    return res.json({ token: 'mock_kiosk_token_789', user: DEMO_KIOSK_USER });
  }
  res.status(401).json({ error: 'Invalid PIN' });
});

// Protected API Routes (require authentication)
app.get('/api/users', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    const usersWithCompat = rows.map(user => ({
      ...user,
      id: user.userId,
      name: `${user.firstName} ${user.lastName}`,
      barangay: 'Cabantian',
      points: user.pointsBalance,
      joined: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      submissions: user.totalSubmissions,
      redeemed: 0
    }));
    res.json(usersWithCompat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE userId = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = rows[0];
    res.json({
      ...user,
      id: user.userId,
      name: `${user.firstName} ${user.lastName}`,
      barangay: 'Cabantian',
      points: user.pointsBalance,
      joined: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      submissions: user.totalSubmissions,
      redeemed: 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/kiosks', authenticate, async (req, res) => {
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

app.get('/api/rewards', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM rewards');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transactions from database
app.get('/api/transactions', authenticate, async (req, res) => {
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
app.post('/api/transactions', authenticate, async (req, res) => {
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

// Weekly analytics — GROUP recycling_transactions by DAY of the past 7 days
app.get('/api/analytics/weekly', authenticate, async (req, res) => {
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
app.get('/api/analytics/monthly', authenticate, async (req, res) => {
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
app.get('/api/analytics/summary', authenticate, async (req, res) => {
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
      SELECT userId, firstName, lastName, pointsBalance, totalSubmissions
      FROM users
      ORDER BY pointsBalance DESC
      LIMIT 5
    `);
    const leaderboard = lbRows.map((u, i) => ({
      rank: i + 1,
      userId: u.userId,
      name: `${u.firstName} ${u.lastName}`,
      barangay: 'Cabantian',
      points: Number(u.pointsBalance),
      avatar: `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`,
      submissions: Number(u.totalSubmissions),
      streak: 1,
    }));

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

// NEW: Reward Redemptions endpoint (list all redemptions from reward_redemptions table)
app.get('/api/redemptions', authenticate, async (req, res) => {
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

app.get('/api/leaderboard', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users ORDER BY pointsBalance DESC LIMIT 10');
    const leaderboard = rows.map((user, index) => ({
      rank: index + 1,
      name: `${user.firstName} ${user.lastName}`,
      barangay: 'Cabantian',
      points: user.pointsBalance,
      avatar: `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`,
      streak: 1,
      isMe: user.userId === 'U-001'
    }));
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
app.get('/api/admin/admins', authenticate, async (req, res) => {
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

app.post('/api/admin/admins', authenticate, async (req, res) => {
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
    const [cnt] = await db.query('SELECT COUNT(*) as cnt FROM administrators');
    const nextNum = (cnt[0].cnt || 0) + 1;
    const adminId = `A-${String(nextNum).padStart(3, '0')}`;
    const passwordHash = `hashed_${password}`;
    const createdAt = new Date();
    await db.query(
      'INSERT INTO administrators (adminId, adminIdentifier, firstName, lastName, passwordHash, barangayId, roleId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [adminId, email.toLowerCase().trim(), firstName, lastName, passwordHash, barangayId, roleId, createdAt]
    );
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Waste2Goods API Server running at http://localhost:${PORT} (with MySQL/XAMPP)`);
  console.log(`📡 Available endpoints: /api/users, /api/admin/admins, /api/kiosks, /api/rewards, /api/transactions, /api/analytics/weekly, /api/analytics/monthly, /api/leaderboard, /api/tasks`);
});
