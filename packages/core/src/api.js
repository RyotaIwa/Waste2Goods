
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
  DEMO_KIOSK_USER,
} from "./constants.js";

// API Configuration — host in localStorage (change Wi‑Fi without rebuild)
const API_HOST_STORAGE_KEY = "w2g_api_host";
const DEFAULT_API_HOST = "localhost";

export function getApiHost() {
  try {
    const stored = localStorage.getItem(API_HOST_STORAGE_KEY);
    return (stored && stored.trim()) || DEFAULT_API_HOST;
  } catch {
    return DEFAULT_API_HOST;
  }
}

export function setApiHost(host) {
  try {
    localStorage.setItem(API_HOST_STORAGE_KEY, host.trim());
  } catch {
    console.warn("Failed to save API host");
  }
}

export function getApiBaseUrl() {
  return `http://${getApiHost()}:3001/api`;
}

export async function testApiConnection() {
  const host = getApiHost();
  try {
    const res = await fetch(`http://${host}:3001/`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return { ok: true, message: `Connected to http://${host}:3001` };
    return { ok: false, message: `Server responded with HTTP ${res.status}` };
  } catch {
    return { ok: false, message: `Cannot reach http://${host}:3001 — check IP and that the backend is running` };
  }
}

// Auth Helpers
const AUTH_STORAGE_KEY = "w2g_auth_state";

export function getStoredAuth() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(authState) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  } catch {
    console.warn("Failed to store auth state");
  }
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    console.warn("Failed to clear auth state");
  }
}

// Generic Fetcher
// forceMockFallback = true (default for pre-login screens, kiosk) → returns mock on network error.
// forceMockFallback = false (admin use) → returns null on any error so caller can properly render DEMO badge.
async function fetchApi(endpoint, options) {
  const forceMockFallback = options?.forceMockFallback === true;
  const auth = getStoredAuth();
  const headers = {
    "Content-Type": "application/json",
    ...(auth?.token ? { "Authorization": `Bearer ${auth.token}` } : {}),
    ...options?.headers,
  };

  try {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      headers,
      ...options,
    });

    if (!response.ok) {
      console.warn(`API Error: ${response.status} ${response.statusText} for ${endpoint}`);
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.info(`fetchApi failed for ${endpoint} (forceMockFallback=${forceMockFallback})`, err?.message || err);
    if (forceMockFallback) {
      return getMockData(endpoint);
    }
    // Admin mode: return null so caller correctly marks data as DEMO-only and shows DEMO badge.
    return null;
  }
}

// Mock Data Resolver
function getMockData(endpoint) {
  if (endpoint === "/users") return USERS;
  if (endpoint.startsWith("/users/")) return USERS[0]; // default user for demo
  if (endpoint === "/kiosks") return KIOSKS;
  if (endpoint === "/rewards") return REWARDS;
  if (endpoint === "/transactions") return TRANSACTIONS;
  if (endpoint === "/analytics/weekly") return WEEKLY_DATA;
  if (endpoint === "/analytics/monthly") return MONTHLY_DATA;
  if (endpoint === "/leaderboard") return LEADERBOARD;
  if (endpoint === "/tasks") return TASKS;
  return null;
}

// ——— refreshCurrentUser helpers (extracted to reduce Cognitive Complexity ≤ 15) ———

function buildDisplayFullName(obj) {
  if (!obj) return "";
  if (obj.name) return obj.name;
  const first = obj.firstName || "";
  const last = obj.lastName || "";
  return `${first} ${last}`.trim();
}

function findAdminMatch(admins, userId, storedAdminId) {
  if (!Array.isArray(admins)) return null;
  return admins.find(a =>
    a.adminId === userId || a.id === userId || a.adminId === storedAdminId
  ) || null;
}

function mergeFreshAdminData(authUser, match, userId) {
  const fullName = buildDisplayFullName(match) || authUser.name;
  return {
    ...authUser,
    id: match.adminId || userId,
    adminId: match.adminId || authUser.adminId,
    name: fullName,
    firstName: match.firstName || authUser.firstName,
    lastName: match.lastName || authUser.lastName,
    email: match.email || match.adminIdentifier || authUser.email,
    roleId: match.roleId ?? authUser.roleId ?? 1,
    barangayId: match.barangayId ?? authUser.barangayId,
  };
}

function pickSubmissionCount(r) {
  const direct = typeof r.submissions === "number" ? r.submissions : 0;
  if (direct) return direct;
  return typeof r.totalSubmissions === "number" ? r.totalSubmissions : 0;
}

function formatJoinedDate(createdAt, fallback) {
  if (!createdAt) return fallback;
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function mergeFreshResidentData(authUser, r, userId) {
  const fullName = buildDisplayFullName(r);
  const submissions = pickSubmissionCount(r);
  const pointsRaw = typeof r.points === "number" ? r.points : r.pointsBalance;
  const points = pointsRaw ?? authUser.points;
  const redeemed = typeof r.redeemed === "number" ? r.redeemed : 0;
  const joined = formatJoinedDate(r.createdAt, authUser.joined);
  const uid = r.userId || r.id || userId;
  return {
    ...authUser,
    id: uid,
    userId: uid,
    name: fullName,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email || authUser.email,
    phone: r.phone,
    barangay: r.barangayName || r.barangay || authUser.barangay,
    barangayName: r.barangayName || r.barangay,
    province: r.province,
    city: r.city,
    streetAddress: r.streetAddress,
    points,
    pointsBalance: r.pointsBalance,
    submissions,
    totalSubmissions: submissions,
    redeemed,
    createdAt: r.createdAt,
    joined,
    status: r.status,
    tier: r.tier,
  };
}

function persistFreshUser(auth, fresh) {
  if (!fresh) return auth.user;
  const next = { ...auth, user: fresh };
  setStoredAuth(next);
  return next.user;
}

// API Methods
export const Waste2GoodsAPI = {
  // Auth
  register: async (data) => {
    // Registration ALWAYS goes through the real backend (no mock fallback).
    // This ensures every new user is INSERTed into the MySQL/XAMPP database correctly.
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Registration failed");
      }
      const result = await response.json();
      const authState = {
        isAuthenticated: true,
        user: result.user,
        token: result.token,
      };
      setStoredAuth(authState);
      return authState;
    } catch (e) {
      throw e instanceof Error ? e : new Error("Registration failed — check backend connection");
    }
  },
  login: async (email, password) => {
    // Login ALWAYS goes through the real backend (no demo shortcut fallbacks for residents).
    // Admin login is still handled by the backend's hardcoded ADMIN_CREDENTIALS check.
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Login failed");
      }
      const result = await response.json();
      const authState = {
        isAuthenticated: true,
        user: result.user,
        token: result.token,
      };
      setStoredAuth(authState);
      return authState;
    } catch (e) {
      throw e instanceof Error ? e : new Error("Login failed — check backend connection or credentials");
    }
  },
  kioskLogin: async (pin) => {
    // Try backend first, fall back to mock if fails
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/kiosk-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!response.ok) {
        throw new Error("API kiosk login failed");
      }
      const result = await response.json();
      const authState = {
        isAuthenticated: true,
        user: result.user,
        token: result.token,
      };
      setStoredAuth(authState);
      return authState;
    } catch {
      // Fallback to mock
      await new Promise(resolve => setTimeout(resolve, 500));
      if (pin === KIOSK_PIN) {
        const authState = {
          isAuthenticated: true,
          user: DEMO_KIOSK_USER,
          token: "mock_kiosk_token_789",
        };
        setStoredAuth(authState);
        return authState;
      }
      throw new Error("Invalid PIN");
    }
  },
  logout: () => {
    clearStoredAuth();
  },
  getAuthState: () => getStoredAuth(),

  // Profile refresh & save (see api.ts for docs)
  async refreshCurrentUser() {
    const auth = getStoredAuth();
    if (!auth?.isAuthenticated || !auth?.user) return null;
    const userId = auth.user.id || auth.user.userId;
    if (!userId) return auth.user;
    const isAdmin = auth.user.role === "admin" || auth.user.adminId;

    let fresh = null;
    if (isAdmin) {
      const admins = await fetchApi("/admin/admins");
      const match = findAdminMatch(admins, userId, auth.user.adminId);
      if (match) fresh = mergeFreshAdminData(auth.user, match, userId);
    } else {
      const resident = await fetchApi(`/users/${userId}`);
      if (resident) fresh = mergeFreshResidentData(auth.user, resident, userId);
    }

    return persistFreshUser(auth, fresh);
  },

  async saveProfile(patches) {
    const auth = getStoredAuth();
    if (!auth?.isAuthenticated || !auth?.user) return false;
    const userId = auth.user.id || auth.user.userId;
    if (!userId) return false;
    const body = { ...patches };
    if (patches.password) body.passwordHash = `hashed_${patches.password}`;
    delete body.password;
    const result = await fetchApi(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (result !== null) {
      await this.refreshCurrentUser();
      try {
        window.dispatchEvent(new StorageEvent("storage", { key: "w2g_auth_state" }));
      } catch { /* ignore */ }
      return true;
    }
    return false;
  },

  async getCurrentRank(authUserId) {
    const auth = getStoredAuth();
    const uid = authUserId || (auth?.user?.id || auth?.user?.userId);
    if (!uid) return "#-";
    const board = await fetchApi("/leaderboard");
    if (!Array.isArray(board) || !board.length) return "#-";
    const idx = board.findIndex(r => r.userId === uid || r.id === uid);
    if (idx === -1) return "#-";
    return `#${idx + 1}`;
  },

  // Mobile notification bell: notifications for ONE logged-in resident
  async getMyNotifications() {
    const auth = getStoredAuth();
    const userId = auth?.user?.id || auth?.user?.userId;
    if (!userId) return { count: 0, unread: 0, items: [] };
    const result = await fetchApi(`/users/${userId}/notifications`);
    if (!result) return { count: 0, unread: 0, items: [], forUser: userId };
    return {
      forUser: result.forUser || userId,
      count: Number(result.count || 0),
      unread: Number(result.unread || 0),
      items: Array.isArray(result.items) ? result.items : [],
    };
  },

  // Users
  getUsers: () => fetchApi("/users"),
  getUserById: (userId) => fetchApi(`/users/${userId}`),
  updateUser: (userId, data) =>
    fetchApi(`/users/${userId}`, { method: "PUT", body: JSON.stringify(data) }),

  // Kiosks
  getKiosks: () => fetchApi("/kiosks"),

  // Rewards
  getRewards: () => fetchApi("/rewards"),

  // Transactions
  getTransactions: () => fetchApi("/transactions"),

  // Analytics
  getWeeklyData: () => fetchApi("/analytics/weekly"),
  getMonthlyData: () => fetchApi("/analytics/monthly"),
  getSummary: () => fetchApi("/analytics/summary"),

  // Leaderboard
  getLeaderboard: () => fetchApi("/leaderboard"),

  // Tasks
  getTasks: () => fetchApi("/tasks"),

  // Redemptions
  getRedemptions: () => fetchApi("/redemptions"),

  // Admin Management
  fetchAdminAdmins: () => fetchApi("/admin/admins"),
  createAdmin: (data) => fetchApi("/admin/admins", { method: "POST", body: JSON.stringify(data) }),

  // Redeem
  redeemReward: (data) => fetchApi("/rewards/redeem", { method: "POST", body: JSON.stringify(data) }),

  // Rewards CRUD (Admin)
  createReward: (data) => fetchApi("/rewards", { method: "POST", body: JSON.stringify(data) }),
  updateReward: (rewardId, data) => fetchApi(`/rewards/${rewardId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteReward: (rewardId) => fetchApi(`/rewards/${rewardId}`, { method: "DELETE" }),

  // Users CRUD / Points Adjust (Admin)
  createUser: (data) => fetchApi("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (userId, data) => fetchApi(`/users/${userId}`, { method: "PUT", body: JSON.stringify(data) }),
  adjustUserPoints: (userId, delta, reason, adminId) =>
    fetchApi(`/users/${userId}/points`, { method: "PUT", body: JSON.stringify({ delta, reason, adminId }) }),

  // Notifications feed
  getNotifications: () => fetchApi("/notifications"),
  fetchNotifications: () => fetchApi("/notifications"),

  // Kiosk operations (Admin)
  calibrateKiosk: (kioskId) => fetchApi(`/kiosks/${kioskId}/calibrate`, { method: "POST" }),
  getKioskLogs: (kioskId) => fetchApi(`/kiosks/${kioskId}/logs`),

  // Convenience aliases (fetchXYZ ↔ getXYZ naming for admin-panel parity)
  fetchUsers: () => fetchApi("/users"),
  fetchRewards: () => fetchApi("/rewards"),
  fetchKiosks: () => fetchApi("/kiosks"),
  fetchTransactions: () => fetchApi("/transactions"),
  fetchAnalyticsWeekly: () => fetchApi("/analytics/weekly"),
  fetchAnalyticsMonthly: () => fetchApi("/analytics/monthly"),
  fetchAnalyticsSummary: () => fetchApi("/analytics/summary"),
  fetchRedemptions: () => fetchApi("/redemptions"),
  fetchLeaderboard: () => fetchApi("/leaderboard"),

  connectKioskSession: (data) =>
    fetchApi("/kiosk/session/connect", { method: "POST", body: JSON.stringify(data) }),
  pingKioskSession: (userId) =>
    fetchApi("/kiosk/session/ping", { method: "POST", body: JSON.stringify({ userId }) }),
  disconnectKioskSession: (userId) =>
    fetchApi("/kiosk/session/disconnect", { method: "POST", body: JSON.stringify({ userId }) }),
  getKioskSessionStatus: (userId) => fetchApi(`/kiosk/session/${userId}`),
};
