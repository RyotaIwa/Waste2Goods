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

// API Configuration
const API_BASE_URL = "http://localhost:3001/api";

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
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const auth = getStoredAuth();
  const headers = {
    "Content-Type": "application/json",
    ...(auth?.token ? { "Authorization": `Bearer ${auth.token}` } : {}),
    ...options?.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
    });

    if (!response.ok) {
      console.warn(`API Error: ${response.status} ${response.statusText} - Falling back to mock data`);
      throw new Error("Network error, using mock data");
    }
    return await response.json();
  } catch {
    // Fallback to mock data if API fails
    console.info(`Using mock data for endpoint ${endpoint}`);
    return getMockData(endpoint) as T;
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

// API Methods
export const Waste2GoodsAPI = {
  // Auth
  register: async (data: { firstName: string; lastName: string; email: string; password: string; phone?: string; province?: string; city?: string; barangayName?: string; streetAddress?: string }) => {
    // Registration ALWAYS goes through the real backend (no mock fallback).
    // This ensures every new user is INSERTed into the MySQL/XAMPP database correctly.
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
      const response = await fetch(`${API_BASE_URL}/auth/kiosk-login`, {
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

  // Users
  getUsers: () => fetchApi<User[]>("/users"),
  getUserById: (userId: string) => fetchApi<User>(`/users/${userId}`),
  updateUser: (userId: string, data: Partial<User>) =>
    fetchApi<User>(`/users/${userId}`, { method: "PUT", body: JSON.stringify(data) }),

  // Kiosks
  getKiosks: () => fetchApi<Kiosk[]>("/kiosks"),

  // Rewards
  getRewards: () => fetchApi<Reward[]>("/rewards"),

  // Transactions
  getTransactions: () => fetchApi<Transaction[]>("/transactions"),

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
};
