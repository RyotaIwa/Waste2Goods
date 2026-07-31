import express from "express";
import cors from "cors";
import db from "./db.js";
import {
  USERS,
  KIOSKS,
  REWARDS,
  TRANSACTIONS,
  WEEKLY_DATA,
  MONTHLY_DATA,
  LEADERBOARD,
  TASKS,
  ADMIN_CREDENTIALS,
  KIOSK_PIN,
  DEMO_RESIDENT_CREDENTIALS,
  DEMO_ADMIN_USER,
  DEMO_RESIDENT_USER,
  DEMO_KIOSK_USER
} from "@waste2goods/core";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Root route - show welcome message
app.get("/", (req, res) => {
  res.json({ 
    message: "Waste2Goods API Server is running (with SQLite)!",
    status: "success",
    availableEndpoints: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "POST /api/auth/kiosk-login",
      "GET /api/users",
      "GET /api/users/:id",
      "GET /api/kiosks",
      "GET /api/rewards",
      "GET /api/transactions",
      "POST /api/transactions",
      "GET /api/analytics/weekly",
      "GET /api/analytics/monthly",
      "GET /api/leaderboard",
      "GET /api/tasks"
    ]
  });
});

// Simple middleware to check auth token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  // Accept mock tokens + any dynamic tokens we generate (token_U-XXX_...)
  if (
    ["mock_admin_token_123", "mock_resident_token_456", "mock_kiosk_token_789"].includes(token) ||
    token.startsWith("token_U-") ||
    token.startsWith("token_A-")
  ) {
    next();
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      firstName, lastName, email, password,
      barangayId = 1, phone = "",
      province = "", city = "", barangayName = ""
    } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "Required fields missing" });
    }
    if (!province || !city || !barangayName) {
      return res.status(400).json({ error: "Please select Province, City, and Barangay" });
    }
    // Check if email exists
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, existing) => {
      if (err) return res.status(500).json({ error: err.message });
      if (existing) return res.status(400).json({ error: "Email already registered" });
      // Count to generate ID
      db.get("SELECT COUNT(*) as cnt FROM users", [], (err, countResult) => {
        if (err) return res.status(500).json({ error: err.message });
        const userNumber = (countResult.cnt || 0) + 1;
        const userId = `U-${String(userNumber).padStart(3, "0")}`;
        const passwordHash = `hashed_${password}`;
        const createdAt = new Date().toISOString();
        db.run(
          "INSERT INTO users (userId, firstName, lastName, email, passwordHash, barangayId, pointsBalance, totalSubmissions, status, phone, province, city, barangayName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [userId, firstName, lastName, email, passwordHash, barangayId, 50, 0, "active", phone, province, city, barangayName, createdAt],
          function (err) {
            if (err) return res.status(500).json({ error: err.message });
            const user = {
              userId, firstName, lastName, email, barangayId, pointsBalance: 50, totalSubmissions: 0,
              status: "active", createdAt, phone, province, city, barangayName,
              id: userId,
              name: `${firstName} ${lastName}`,
              barangay: barangayName || "Cabantian",
              points: 50,
              joined: new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              submissions: 0,
              redeemed: 0
            };
            const token = `token_${userId}_${Date.now()}`;
            res.status(201).json({ token, user, message: "Registration successful! +50 welcome points!" });
          }
        );
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  // Admin login
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    return res.json({ token: "mock_admin_token_123", user: DEMO_ADMIN_USER });
  }
  // Demo resident login
  if (email === DEMO_RESIDENT_CREDENTIALS.email && password === DEMO_RESIDENT_CREDENTIALS.password) {
    return res.json({ token: "mock_resident_token_456", user: DEMO_RESIDENT_USER });
  }
  // Try database for registered users
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const expectedHash = `hashed_${password}`;
    if (user.passwordHash !== password && user.passwordHash !== expectedHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const userWithCompat = {
      ...user,
      id: user.userId,
      name: `${user.firstName} ${user.lastName}`,
      barangay: "Cabantian",
      points: user.pointsBalance,
      joined: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      submissions: user.totalSubmissions,
      redeemed: 0
    };
    const token = `token_${user.userId}_${Date.now()}`;
    return res.json({ token, user: userWithCompat });
  });
});

app.post("/api/auth/kiosk-login", (req, res) => {
  const { pin } = req.body;
  if (pin === KIOSK_PIN) {
    return res.json({ token: "mock_kiosk_token_789", user: DEMO_KIOSK_USER });
  }
  res.status(401).json({ error: "Invalid PIN" });
});

// Protected API Routes (require authentication)
app.get("/api/users", authenticate, (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Add compatibility fields for frontend
    const usersWithCompat = rows.map(user => ({
      ...user,
      id: user.userId,
      name: `${user.firstName} ${user.lastName}`,
      barangay: "Cabantian",
      points: user.pointsBalance,
      joined: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      submissions: user.totalSubmissions,
      redeemed: 0
    }));
    res.json(usersWithCompat);
  });
});

app.get("/api/users/:id", authenticate, (req, res) => {
  db.get("SELECT * FROM users WHERE userId = ?", [req.params.id], (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    // Add compatibility fields
    res.json({
      ...user,
      id: user.userId,
      name: `${user.firstName} ${user.lastName}`,
      barangay: "Cabantian",
      points: user.pointsBalance,
      joined: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      submissions: user.totalSubmissions,
      redeemed: 0
    });
  });
});

app.get("/api/kiosks", authenticate, (req, res) => {
  db.all("SELECT * FROM kiosks", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Add compatibility fields
    const kiosksWithCompat = rows.map(kiosk => ({
      ...kiosk,
      id: kiosk.kioskId,
      weight: "—",
      submissions: 0
    }));
    res.json(kiosksWithCompat);
  });
});

app.get("/api/rewards", authenticate, (req, res) => {
  db.all("SELECT * FROM rewards", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Transactions from database
app.get("/api/transactions", authenticate, (req, res) => {
  db.all("SELECT * FROM recycling_transactions", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Add compatibility fields
    const transactionsWithCompat = rows.map(tx => ({
      ...tx,
      id: tx.transactionId,
      date: new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'earn',
      desc: `PET Plastic · ${tx.weightKg} kg · ${tx.kioskId}`,
      pts: tx.pointsEarned
    }));
    res.json(transactionsWithCompat);
  });
});

// Add a new recycling transaction (POST)
app.post("/api/transactions", authenticate, (req, res) => {
  const { userId, materialId, weightKg, kioskId } = req.body;
  // Calculate points earned (1kg PET = 50 points)
  const pointsEarned = Math.round(weightKg * 50);
  const transactionId = `RT-${Date.now()}`;
  
  db.run(
    "INSERT INTO recycling_transactions (transactionId, userId, materialId, weightKg, pointsEarned, kioskId, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [transactionId, userId, materialId, weightKg, pointsEarned, kioskId, new Date().toISOString()],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Update user's points balance and total submissions
      db.run(
        "UPDATE users SET pointsBalance = pointsBalance + ?, totalSubmissions = totalSubmissions + 1 WHERE userId = ?",
        [pointsEarned, userId],
        function(updateErr) {
          if (updateErr) {
            res.status(500).json({ error: updateErr.message });
            return;
          }
          res.json({ 
            message: "Transaction created successfully", 
            transactionId, 
            pointsEarned 
          });
        }
      );
    }
  );
});

// Keep analytics, leaderboard, tasks as mock for now (you can update these later too!)
app.get("/api/analytics/weekly", authenticate, (req, res) => res.json(WEEKLY_DATA));
app.get("/api/analytics/monthly", authenticate, (req, res) => res.json(MONTHLY_DATA));
app.get("/api/leaderboard", authenticate, (req, res) => {
  // Get leaderboard from database (users sorted by points)
  db.all("SELECT * FROM users ORDER BY pointsBalance DESC LIMIT 10", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const leaderboard = rows.map((user, index) => ({
      rank: index + 1,
      name: `${user.firstName} ${user.lastName}`,
      barangay: "Cabantian",
      points: user.pointsBalance,
      avatar: `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`,
      streak: 1,
      isMe: user.userId === "U-001"
    }));
    res.json(leaderboard);
  });
});
app.get("/api/tasks", authenticate, (req, res) => res.json(TASKS));

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

app.post("/api/kiosk/session/connect", (req, res) => {
  const { userId, userName, kioskId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "userId required" });
  const session = {
    userId,
    userName: userName || "User",
    kioskId: kioskId || "K-01",
    connectedAt: Date.now(),
    lastPing: Date.now(),
  };
  kioskSessions.set(userId, session);
  res.json({ ok: true, connected: true, ...session });
});

app.post("/api/kiosk/session/ping", (req, res) => {
  const { userId } = req.body || {};
  const s = getActiveKioskSession(userId);
  if (!s) return res.json({ connected: false });
  s.lastPing = Date.now();
  res.json({ connected: true, ...s });
});

app.post("/api/kiosk/session/disconnect", (req, res) => {
  const { userId } = req.body || {};
  if (userId) kioskSessions.delete(userId);
  res.json({ ok: true, connected: false });
});

app.get("/api/kiosk/session/:userId", (req, res) => {
  const s = getActiveKioskSession(req.params.userId);
  if (!s) return res.json({ connected: false });
  res.json({ connected: true, kioskId: s.kioskId, userName: s.userName, connectedAt: s.connectedAt, lastPing: s.lastPing });
});

// Start server — bind on 0.0.0.0 so phones on the LAN can reach us via the PC's Wi-Fi IP
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Waste2Goods API Server running at http://localhost:${PORT} (with SQLite)`);
  console.log(`📡 LAN access: http://<YOUR-PC-WIFI-IP>:${PORT} — find your IP with: ipconfig`);
  console.log(`📡 Available endpoints: /api/users, /api/kiosks, /api/rewards, /api/transactions, /api/analytics/weekly, /api/analytics/monthly, /api/leaderboard, /api/tasks`);
});
