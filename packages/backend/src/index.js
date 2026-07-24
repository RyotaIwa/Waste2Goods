import express from "express";
import cors from "cors";
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

// Simple middleware to check auth token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  // For demo, just check if it's a valid token
  if (["mock_admin_token_123", "mock_resident_token_456", "mock_kiosk_token_789"].includes(token)) {
    next();
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// Auth Routes
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    return res.json({ token: "mock_admin_token_123", user: DEMO_ADMIN_USER });
  }
  if (email === DEMO_RESIDENT_CREDENTIALS.email && password === DEMO_RESIDENT_CREDENTIALS.password) {
    return res.json({ token: "mock_resident_token_456", user: DEMO_RESIDENT_USER });
  }
  res.status(401).json({ error: "Invalid credentials" });
});

app.post("/api/auth/kiosk-login", (req, res) => {
  const { pin } = req.body;
  if (pin === KIOSK_PIN) {
    return res.json({ token: "mock_kiosk_token_789", user: DEMO_KIOSK_USER });
  }
  res.status(401).json({ error: "Invalid PIN" });
});

// Protected API Routes (require authentication)
app.get("/api/users", authenticate, (req, res) => res.json(USERS));
app.get("/api/users/:id", authenticate, (req, res) => {
  const user = USERS.find(u => u.id === req.params.id);
  if (user) res.json(user);
  else res.status(404).json({ error: "User not found" });
});
app.get("/api/kiosks", authenticate, (req, res) => res.json(KIOSKS));
app.get("/api/rewards", authenticate, (req, res) => res.json(REWARDS));
app.get("/api/transactions", authenticate, (req, res) => res.json(TRANSACTIONS));
app.get("/api/analytics/weekly", authenticate, (req, res) => res.json(WEEKLY_DATA));
app.get("/api/analytics/monthly", authenticate, (req, res) => res.json(MONTHLY_DATA));
app.get("/api/leaderboard", authenticate, (req, res) => res.json(LEADERBOARD));
app.get("/api/tasks", authenticate, (req, res) => res.json(TASKS));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Waste2Goods API Server running at http://localhost:${PORT}`);
  console.log(`📡 Available endpoints: /api/users, /api/kiosks, /api/rewards, /api/transactions, /api/analytics/weekly, /api/analytics/monthly, /api/leaderboard, /api/tasks`);
});
