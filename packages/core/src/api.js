
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

// API Configuration
const API_BASE_URL = "http://localhost:3001/api";

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
async function fetchApi(endpoint, options) {
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
    return getMockData(endpoint);
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

// API Methods
export const Waste2GoodsAPI = {
  // Auth
  login: async (email, password) => {
    // Try backend first, fall back to mock if fails
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error("API login failed");
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
      await new Promise(resolve => setTimeout(resolve, 800));
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const authState = {
          isAuthenticated: true,
          user: DEMO_ADMIN_USER,
          token: "mock_admin_token_123",
        };
        setStoredAuth(authState);
        return authState;
      }
      if (email === DEMO_RESIDENT_CREDENTIALS.email && password === DEMO_RESIDENT_CREDENTIALS.password) {
        const authState = {
          isAuthenticated: true,
          user: DEMO_RESIDENT_USER,
          token: "mock_resident_token_456",
        };
        setStoredAuth(authState);
        return authState;
      }
      throw new Error("Invalid credentials");
    }
  },
  kioskLogin: async (pin) => {
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

  // Leaderboard
  getLeaderboard: () => fetchApi("/leaderboard"),

  // Tasks
  getTasks: () => fetchApi("/tasks"),
};
