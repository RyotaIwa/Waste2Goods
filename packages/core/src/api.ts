import {
  User,
  Kiosk,
  Reward,
  Transaction,
  WeeklyData,
  MonthlyData,
  LeaderboardUser,
  Task,
  AuthUser,
  AuthState,
} from "./types";
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
} from "./constants";

// API Configuration — host stored in localStorage so mobile/kiosk can switch Wi‑Fi without rebuild.
// On DigitalOcean / production builds, prefer VITE_API_BASE_URL (absolute or origin-relative "/api")
// so the UI hits the Nginx reverse proxy on the same HTTPS domain (no port number needed).
const API_HOST_STORAGE_KEY = "w2g_api_host";
const API_PORT_STORAGE_KEY = "w2g_api_port";
const API_PROTOCOL_STORAGE_KEY = "w2g_api_protocol";

const STATIC_BASE_URL: string | undefined = (
  typeof (import.meta as any)?.env?.VITE_API_BASE_URL === "string" && (import.meta as any).env.VITE_API_BASE_URL !== ""
) ? (import.meta as any).env.VITE_API_BASE_URL : undefined;

const DEFAULT_PROTOCOL =
  (typeof (import.meta as any)?.env?.VITE_API_PROTOCOL === "string" && (import.meta as any).env.VITE_API_PROTOCOL) ||
  (typeof window !== "undefined" && window.location.protocol === "https:" ? "https" : "http") ||
  "http";

const DEFAULT_PORT =
  (typeof (import.meta as any)?.env?.VITE_API_PORT === "string" && (import.meta as any).env.VITE_API_PORT) ||
  (DEFAULT_PROTOCOL === "https" ? "" : "3001");

const DEFAULT_API_HOST =
  (typeof (import.meta as any)?.env?.VITE_API_HOST === "string" && (import.meta as any).env.VITE_API_HOST) ||
  "localhost";

function parseHostAndPort(rawInput: string): { host: string; port: string; proto: "http" | "https" } {
  let str = (rawInput || "").trim();
  let proto: "http" | "https" = (typeof window !== "undefined" && window.location.protocol === "https:") ? "https" : "http";
  if (str.startsWith("https://")) {
    proto = "https";
    str = str.replace(/^https:\/\//i, "");
  } else if (str.startsWith("http://")) {
    proto = "http";
    str = str.replace(/^http:\/\//i, "");
  }
  // Strip trailing slashes and paths like /api
  str = str.replace(/\/.*$/, "").trim();

  let host = str || "localhost";
  let port = String(DEFAULT_PORT || "3001");

  // Check if string contains port (e.g. 192.168.1.164:3001 or 192.168.1.164:5173:3001)
  if (str.includes(":")) {
    const parts = str.split(":").filter(Boolean);
    host = parts[0] || "localhost";
    const lastPort = parts[parts.length - 1];
    // If user passed Vite dev server port 5173, change to backend port 3001
    if (lastPort === "5173" || lastPort === "5174") {
      port = "3001";
    } else if (lastPort && /^\d+$/.test(lastPort)) {
      port = lastPort;
    }
  }

  return { host, port, proto };
}

export function getApiHost(): string {
  try {
    const stored = localStorage.getItem(API_HOST_STORAGE_KEY);
    if (stored && stored.trim()) {
      return parseHostAndPort(stored).host;
    }
    return DEFAULT_API_HOST;
  } catch {
    return DEFAULT_API_HOST;
  }
}

export function setApiHost(rawHost: string) {
  try {
    const { host, port, proto } = parseHostAndPort(rawHost);
    localStorage.setItem(API_HOST_STORAGE_KEY, host);
    if (port) localStorage.setItem(API_PORT_STORAGE_KEY, port);
    localStorage.setItem(API_PROTOCOL_STORAGE_KEY, proto);
  } catch {
    console.warn("Failed to save API host");
  }
}

export function getApiPort(): string {
  try {
    const stored = localStorage.getItem(API_PORT_STORAGE_KEY);
    if (stored != null && stored.trim() !== "") {
      const p = stored.trim().replace(/^:/, "");
      if (p === "5173" || p === "5174") return "3001";
      return p;
    }
  } catch { /* ignore */ }
  return String(DEFAULT_PORT || "3001");
}

export function setApiPort(port: string) {
  try { localStorage.setItem(API_PORT_STORAGE_KEY, String(port ?? "").replace(/^:/, "").trim()); } catch { /* ignore */ }
}

export function getApiProtocol(): string {
  try {
    const stored = localStorage.getItem(API_PROTOCOL_STORAGE_KEY);
    if (stored === "http" || stored === "https") return stored;
  } catch { /* ignore */ }
  return DEFAULT_PROTOCOL;
}

export function setApiProtocol(proto: "http" | "https") {
  try { localStorage.setItem(API_PROTOCOL_STORAGE_KEY, proto); } catch { /* ignore */ }
}

export function getApiBaseUrl(): string {
  if (STATIC_BASE_URL) {
    if (STATIC_BASE_URL.startsWith("http://") || STATIC_BASE_URL.startsWith("https://") || STATIC_BASE_URL.startsWith("/")) {
      return STATIC_BASE_URL.endsWith("/api") ? STATIC_BASE_URL : `${STATIC_BASE_URL.replace(/\/$/, "")}/api`;
    }
  }
  const proto = getApiProtocol();
  const host = getApiHost();
  const port = getApiPort();
  const portPart = port ? `:${port}` : "";
  return `${proto}://${host}${portPart}/api`;
}

export async function testApiConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    if (STATIC_BASE_URL) {
      const root = STATIC_BASE_URL.endsWith("/api") ? STATIC_BASE_URL.slice(0, -"/api".length) || "/" : "/";
      const url = root.startsWith("http") ? (root.endsWith("/") ? root : root + "/") : "/";
      const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(8000) });
      if (res.ok) return { ok: true, message: `Connected to ${url}` };
      return { ok: false, message: `Server responded with HTTP ${res.status}` };
    }
  } catch { /* ignore, fall through to direct host:port check */ }

  const proto = getApiProtocol();
  const host = getApiHost();
  const port = getApiPort();
  const portPart = port ? `:${port}` : "";
  const url = `${proto}://${host}${portPart}/`;
  try {
    const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(5000) });
    if (res.ok) return { ok: true, message: `Connected to ${proto}://${host}${portPart}` };
    return { ok: false, message: `Server responded with HTTP ${res.status}` };
  } catch {
    return { ok: false, message: `Cannot reach ${proto}://${host}${portPart} — check IP and that the backend is running on port ${port}` };
  }
}

// Auth Helpers
const AUTH_STORAGE_KEY = "w2g_auth_state";

export function getStoredAuth(): AuthState | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(authState: AuthState) {
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
// Use options.forceMockFallback = true only for kiosk/mobile pre-login screens
// where mock-data UX is acceptable. Admin endpoints leave this unset so
// failures return null and caller correctly shows DEMO fallback badge.
type FetchOpts = RequestInit & { forceMockFallback?: boolean };
async function fetchApi<T>(endpoint: string, options?: FetchOpts): Promise<T | null> {
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
    return await response.json() as T;
  } catch (err) {
    console.info(`fetchApi failed for ${endpoint} (forceMockFallback=${forceMockFallback})`, err);
    if (forceMockFallback) {
      return getMockData(endpoint) as T | null;
    }
    return null;
  }
}

// Mock Data Resolver
function getMockData(endpoint: string) {
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

function buildDisplayFullName(obj: any): string {
  if (!obj) return "";
  if (obj.name) return String(obj.name);
  const first = obj.firstName || "";
  const last = obj.lastName || "";
  return `${first} ${last}`.trim();
}

function findAdminMatch(admins: any, userId: string, storedAdminId?: string): any | null {
  if (!Array.isArray(admins)) return null;
  return admins.find(a =>
    a.adminId === userId || a.id === userId || a.adminId === storedAdminId
  ) || null;
}

function mergeFreshAdminData(authUser: AuthUser, match: any, userId: string): AuthUser {
  const fullName = buildDisplayFullName(match) || authUser.name;
  const a = authUser as any;
  return {
    ...authUser,
    id: match.adminId || userId,
    adminId: match.adminId || a.adminId,
    name: fullName,
    firstName: match.firstName || a.firstName,
    lastName: match.lastName || a.lastName,
    email: match.email || match.adminIdentifier || authUser.email,
    roleId: match.roleId ?? a.roleId ?? 1,
    barangayId: match.barangayId ?? a.barangayId,
  } as AuthUser;
}

function pickSubmissionCount(r: any): number {
  const direct = typeof r.submissions === "number" ? r.submissions : 0;
  if (direct) return direct;
  return typeof r.totalSubmissions === "number" ? r.totalSubmissions : 0;
}

function formatJoinedDate(createdAt: any, fallback: string | undefined): string | undefined {
  if (!createdAt) return fallback;
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function mergeFreshResidentData(authUser: AuthUser, resident: any, userId: string): AuthUser {
  const r = resident as any;
  const fullName = buildDisplayFullName(r);
  const submissions = pickSubmissionCount(r);
  const pointsRaw = typeof r.points === "number" ? r.points : r.pointsBalance;
  const a = authUser as any;
  const points = pointsRaw ?? a.points;
  const redeemed = typeof r.redeemed === "number" ? r.redeemed : 0;
  const joined = formatJoinedDate(r.createdAt, a.joined);
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
    barangay: r.barangayName || r.barangay || a.barangay,
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
  } as AuthUser;
}

function persistFreshUser(auth: AuthState, fresh: AuthUser | null): AuthUser {
  if (!fresh) return auth.user;
  const next: AuthState = { ...auth, user: fresh };
  setStoredAuth(next);
  return next.user;
}

// API Methods
export const Waste2GoodsAPI = {
  // Auth
  register: async (data: { firstName: string; lastName: string; email: string; password: string; phone?: string; province?: string; city?: string; barangayName?: string; streetAddress?: string }) => {
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
      const authState: AuthState = {
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
  login: async (email: string, password: string) => {
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
      const authState: AuthState = {
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
  kioskLogin: async (pin: string) => {
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
      const authState: AuthState = {
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
        const authState: AuthState = {
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

  // ——— Profile refresh / save (Mobile + Admin "My Profile") ———
  // Re-fetches the currently-logged-in user (resident) from GET /users/:id
  // and updates localStorage so all UI components display the latest data
  // (points, submissions, name, barangay, etc.) — fixes stale session data.
  async refreshCurrentUser(): Promise<AuthState["user"] | null> {
    const auth = getStoredAuth();
    if (!auth?.isAuthenticated || !auth?.user) return null;
    const userId = (auth.user as any).id || (auth.user as any).userId;
    if (!userId) return auth.user;
    const isAdmin = auth.user.role === "admin" || (auth.user as any).adminId;

    let fresh: AuthUser | null = null;
    if (isAdmin) {
      const admins = await fetchApi<any[]>("/admin/admins");
      const match = findAdminMatch(admins, userId, (auth.user as any).adminId);
      if (match) fresh = mergeFreshAdminData(auth.user, match, userId);
    } else {
      const resident = await fetchApi<User>(`/users/${userId}`);
      if (resident) fresh = mergeFreshResidentData(auth.user, resident, userId);
    }

    return persistFreshUser(auth, fresh);
  },

  // For residents: save edits to profile, call refreshCurrentUser to sync UI,
  // then dispatch StorageEvent so all open tabs + QR bridge sync too.
  async saveProfile(patches: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    province?: string;
    city?: string;
    barangayName?: string;
    streetAddress?: string;
    password?: string;
  }): Promise<boolean> {
    const auth = getStoredAuth();
    if (!auth?.isAuthenticated || !auth?.user) return false;
    const userId = (auth.user as any).id || (auth.user as any).userId;
    if (!userId) return false;
    const body: any = { ...patches };
    if (patches.password) body.passwordHash = `hashed_${patches.password}`;
    delete body.password;
    const result = await fetchApi<any>(`/users/${userId}`, {
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

  // Returns user's rank by points among the weekly leaderboard (defaults to the
  // stored leaderboard endpoint). Returns "#-" if unknown. This avoids the
  // hardcoded "#3 Weekly Rank" in the mobile profile header.
  async getCurrentRank(authUserId?: string): Promise<string> {
    const auth = getStoredAuth();
    const uid = authUserId || (auth?.user as any)?.id || (auth?.user as any)?.userId;
    if (!uid) return "#-";
    const board = await fetchApi<LeaderboardUser[]>("/leaderboard");
    if (!Array.isArray(board) || !board.length) return "#-";
    const idx = board.findIndex(r => (r as any).userId === uid || (r as any).id === uid);
    if (idx === -1) return "#-";
    return `#${idx + 1}`;
  },

  // Mobile notification bell: notifications for ONE logged-in resident
  // (their submissions, redemptions, tasks, welcome/tier milestones).
  // Calls GET /api/users/:userId/notifications — scoped ONLY to this user.
  async getMyNotifications(): Promise<{ count: number; unread: number; items: any[]; forUser?: string } | null> {
    const auth = getStoredAuth();
    const userId = (auth?.user as any)?.id || (auth?.user as any)?.userId;
    if (!userId) return { count: 0, unread: 0, items: [] };
    const result = await fetchApi<any>(`/users/${userId}/notifications`);
    if (!result) return { count: 0, unread: 0, items: [], forUser: userId };
    return {
      forUser: result.forUser || userId,
      count: Number(result.count || 0),
      unread: Number(result.unread || 0),
      items: Array.isArray(result.items) ? result.items : [],
    };
  },

  // Users
  getUsers: () => fetchApi<User[]>("/users"),
  getUserById: (userId: string) => fetchApi<User>(`/users/${userId}`),

  // Kiosks
  getKiosks: () => fetchApi<Kiosk[]>("/kiosks"),

  // Rewards
  getRewards: () => fetchApi<Reward[]>("/rewards"),

  // Transactions
  getTransactions: () => fetchApi<Transaction[]>("/transactions"),
  createTransaction: (data: { userId: string; materialId?: number; weightKg: number; kioskId?: string }) =>
    fetchApi<any>("/transactions", {
      method: "POST",
      body: JSON.stringify({
        userId: data.userId,
        materialId: data.materialId || 1,
        weightKg: data.weightKg,
        kioskId: data.kioskId || "K-01"
      }),
    }),

  // Analytics
  getWeeklyData: () => fetchApi<WeeklyData[]>("/analytics/weekly"),
  getMonthlyData: () => fetchApi<MonthlyData[]>("/analytics/monthly"),
  getSummary: () => fetchApi<any>("/analytics/summary"),

  // Leaderboard
  getLeaderboard: () => fetchApi<LeaderboardUser[]>("/leaderboard"),

  // Tasks
  getTasks: () => fetchApi<Task[]>("/tasks"),

  // Redemptions
  getRedemptions: () => fetchApi<any[]>("/redemptions"),

  // Admin Management (only usable by authenticated admins)
  fetchAdminAdmins: () => fetchApi<any[]>("/admin/admins"),
  createAdmin: (data: { firstName: string; lastName: string; email: string; password: string; barangayId?: number; roleId?: number }) =>
    fetchApi<any>("/admin/admins", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteAdmin: (adminId: string) =>
    fetchApi<any>(`/admin/admins/${adminId}`, {
      method: "DELETE",
    }),
  updateAdminStatus: (adminId: string, status: "active" | "archived" = "archived") =>
    fetchApi<any>(`/admin/admins/${adminId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  archiveAdmin: (adminId: string, status: "active" | "archived" = "archived") =>
    fetchApi<any>(`/admin/admins/${adminId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  // Redeem
  redeemReward: (data: { userId: string; rewardId: number | string; quantity?: number }) =>
    fetchApi<any>("/rewards/redeem", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Rewards CRUD (Admin)
  createReward: (data: {
    rewardName: string;
    pointsCost: number;
    stockQuantity?: number;
    description?: string;
    category?: string;
    icon?: string;
    isSeasonal?: 0 | 1 | boolean;
    status?: string;
  }) =>
    fetchApi<any>("/rewards", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateReward: (
    rewardId: number | string,
    data: {
      rewardName?: string;
      pointsCost?: number;
      stockQuantity?: number;
      description?: string;
      category?: string;
      icon?: string;
      isSeasonal?: 0 | 1 | boolean;
      status?: string;
    }
  ) =>
    fetchApi<any>(`/rewards/${rewardId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteReward: (rewardId: number | string) =>
    fetchApi<any>(`/rewards/${rewardId}`, { method: "DELETE" }),

  // Users CRUD / Points Adjust (Admin)
  createUser: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    barangayId?: number;
    pointsBalance?: number;
    phone?: string;
    province?: string;
    city?: string;
    barangayName?: string;
    streetAddress?: string;
  }) =>
    fetchApi<any>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateUser: (
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      barangayId?: number;
      pointsBalance?: number;
      phone?: string;
      province?: string;
      city?: string;
      barangayName?: string;
      streetAddress?: string;
      status?: string;
      passwordHash?: string;
    }
  ) =>
    fetchApi<any>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  adjustUserPoints: (userId: string, delta: number, reason?: string, adminId?: string) =>
    fetchApi<any>(`/users/${userId}/points`, {
      method: "PUT",
      body: JSON.stringify({ delta, reason, adminId }),
    }),

  // Notifications feed
  getNotifications: () => fetchApi<any>("/notifications"),
  fetchNotifications: () => fetchApi<any>("/notifications"),

  // Kiosk operations (Admin)
  calibrateKiosk: (kioskId: string) =>
    fetchApi<any>(`/kiosks/${kioskId}/calibrate`, { method: "POST" }),
  getKioskLogs: (kioskId: string) => fetchApi<any>(`/kiosks/${kioskId}/logs`),

  // Convenience aliases (fetchXYZ ↔ getXYZ naming for admin-panel parity)
  fetchUsers: () => fetchApi<any[]>("/users"),
  fetchRewards: () => fetchApi<any[]>("/rewards"),
  fetchKiosks: () => fetchApi<any[]>("/kiosks"),
  fetchTransactions: () => fetchApi<any[]>("/transactions"),
  fetchAnalyticsWeekly: () => fetchApi<any[]>("/analytics/weekly"),
  fetchAnalyticsMonthly: () => fetchApi<any[]>("/analytics/monthly"),
  fetchAnalyticsSummary: () => fetchApi<any>("/analytics/summary"),
  fetchRedemptions: () => fetchApi<any[]>("/redemptions"),
  fetchLeaderboard: () => fetchApi<any[]>("/leaderboard"),

  // Kiosk ↔ mobile live session
  connectKioskSession: (data: { userId: string; userName?: string; kioskId?: string }) =>
    fetchApi<any>("/kiosk/session/connect", { method: "POST", body: JSON.stringify(data) }),
  pingKioskSession: (userId: string) =>
    fetchApi<any>("/kiosk/session/ping", { method: "POST", body: JSON.stringify({ userId }) }),
  disconnectKioskSession: (userId: string) =>
    fetchApi<any>("/kiosk/session/disconnect", { method: "POST", body: JSON.stringify({ userId }) }),
  getKioskSessionStatus: (userId: string) =>
    fetchApi<{ connected: boolean; kioskId?: string; userName?: string; connectedAt?: number }>(
      `/kiosk/session/${userId}`
    ),
};
