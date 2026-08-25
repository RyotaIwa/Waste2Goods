import { useState, useEffect } from "react";
import {
  BarChart3, Users, TrendingUp, Bell, Search, LogOut, Recycle,
  ArrowLeft, Zap, Award, ShoppingCart, Scale, Shield,
  X, Plus, Download, Eye, Edit, Trash2,
  AlertCircle, MapPin, Cpu, RefreshCw, Battery, Gift,
  Lock, Mail, AlertTriangle, Check
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { SCard, RankIcon, StatusPip } from "./components/SCard";
import { Waste2GoodsAPI } from "@waste2goods/core";

// Data constants
const weeklyData = [
  { day: "Mon", kg: 42 }, { day: "Tue", kg: 67 }, { day: "Wed", kg: 53 },
  { day: "Thu", kg: 89 }, { day: "Fri", kg: 74 }, { day: "Sat", kg: 112 }, { day: "Sun", kg: 95 }
];
const monthlyData = [
  { month: "Jan", collected: 820, users: 210, redeemed: 65 },
  { month: "Feb", collected: 940, users: 245, redeemed: 80 },
  { month: "Mar", collected: 1100, users: 290, redeemed: 102 },
  { month: "Apr", collected: 980, users: 275, redeemed: 89 },
  { month: "May", collected: 1340, users: 340, redeemed: 134 },
  { month: "Jun", collected: 1450, users: 380, redeemed: 158 }
];
const wasteTypes = [
  { name: "PET Plastic", value: 100, color: "#16a34a" }
];
const leaderboard = [
  { rank: 1, name: "Ana Reyes", barangay: "Cabantian", points: 4820, avatar: "AR", streak: 14 },
  { rank: 2, name: "Carlo Mendoza", barangay: "Cabantian", points: 3950, avatar: "CM", streak: 9 },
  { rank: 3, name: "Maria Santos", barangay: "Cabantian", points: 2840, avatar: "MS", streak: 7 },
  { rank: 4, name: "Jose Dela Cruz", barangay: "Cabantian", points: 2310, avatar: "JD", streak: 5 },
  { rank: 5, name: "Liza Villareal", barangay: "Cabantian", points: 1990, avatar: "LV", streak: 3 },
  { rank: 6, name: "Ben Pascual", barangay: "Cabantian", points: 1640, avatar: "BP", streak: 2 },
];
const rewards = [
  { id: 1, name: "School Supplies Kit", points: 500, category: "Education", stock: 23, icon: "📚", seasonal: false },
  { id: 2, name: "Grocery Voucher ₱100", points: 800, category: "Grocery", stock: 15, icon: "🛒", seasonal: false },
  { id: 3, name: "Eco Water Bottle", points: 350, category: "Lifestyle", stock: 41, icon: "🍶", seasonal: false },
  { id: 4, name: "Rice (5kg)", points: 1200, category: "Grocery", stock: 8, icon: "🌾", seasonal: false },
  { id: 5, name: "Plant Seedling Set", points: 250, category: "Garden", stock: 60, icon: "🌱", seasonal: true },
  { id: 6, name: "Reusable Bag Bundle", points: 180, category: "Lifestyle", stock: 88, icon: "👜", seasonal: false },
  { id: 7, name: "Back-to-School Bundle", points: 650, category: "Education", stock: 12, icon: "🎒", seasonal: true },
  { id: 8, name: "Herbal Tea Set", points: 300, category: "Wellness", stock: 35, icon: "🍵", seasonal: true },
];
const transactions = [
  { id: "T-0041", date: "Jun 17, 2026", type: "earn", desc: "PET Plastic · 2.3 kg · K-01", pts: 115 },
  { id: "T-0040", date: "Jun 16, 2026", type: "earn", desc: "Cardboard · 3.1 kg · K-02", pts: 93 },
  { id: "T-0039", date: "Jun 15, 2026", type: "redeem", desc: "Eco Water Bottle", pts: -350 },
  { id: "T-0038", date: "Jun 14, 2026", type: "earn", desc: "Metal Cans · 1.8 kg · K-01", pts: 144 },
  { id: "T-0037", date: "Jun 13, 2026", type: "bonus", desc: "Weekly Challenge Complete", pts: 150 },
  { id: "T-0036", date: "Jun 12, 2026", type: "earn", desc: "Glass Bottles · 2.0 kg · K-04", pts: 50 },
];
const adminUsers = [
  { id: "U-001", name: "Maria Santos", barangay: "Cabantian", points: 2840, status: "active", joined: "Mar 12, 2025", submissions: 34, redeemed: 2 },
  { id: "U-002", name: "Ana Reyes", barangay: "Cabantian", points: 4820, status: "active", joined: "Jan 5, 2025", submissions: 67, redeemed: 8 },
  { id: "U-003", name: "Carlo Mendoza", barangay: "Cabantian", points: 3950, status: "active", joined: "Feb 18, 2025", submissions: 52, redeemed: 5 },
  { id: "U-004", name: "Ben Pascual", barangay: "Cabantian", points: 890, status: "inactive", joined: "Apr 2, 2025", submissions: 11, redeemed: 1 },
  { id: "U-005", name: "Rosa Guinto", barangay: "Cabantian", points: 1540, status: "active", joined: "Mar 28, 2025", submissions: 21, redeemed: 3 },
  { id: "U-006", name: "Liza Villareal", barangay: "Cabantian", points: 1990, status: "active", joined: "Feb 1, 2025", submissions: 28, redeemed: 4 },
];
const kiosks = [
  { id: "K-01", location: "Cabantian Hall", status: "online", weight: "2.3 kg", submissions: 12, battery: 94, lastPing: "2 min ago", temp: "28°C" },
  { id: "K-02", location: "Cabantian Elementary School", status: "online", weight: "0.8 kg", submissions: 7, battery: 78, lastPing: "1 min ago", temp: "27°C" },
  { id: "K-03", location: "Cabantian Market", status: "offline", weight: "—", submissions: 0, battery: 0, lastPing: "3 hrs ago", temp: "—" },
  { id: "K-04", location: "Cabantian Covered Court", status: "online", weight: "4.1 kg", submissions: 19, battery: 61, lastPing: "just now", temp: "30°C" },
  { id: "K-05", location: "Cabantian Gym", status: "maintenance", weight: "—", submissions: 0, battery: 45, lastPing: "45 min ago", temp: "—" },
];

const STYLE_MIN_HEIGHT = 740;
const STYLE_GRADIENT_DARK = "linear-gradient(180deg, #052e16 0%, #0c3547 100%)";
const STYLE_FONT_INTER = "'Inter', sans-serif";
const BADGE_SUCCESS_CLS = "bg-green-100 text-green-700";
const BADGE_DANGER_CLS = "bg-red-50 border border-red-200 text-red-700";
const BADGE_OK_CLS = "bg-green-50 border border-green-200 text-green-700";
const BADGE_WARN_CLS = "bg-amber-100 text-amber-700";
const BTN_PRIMARY_CLS = "rounded-xl bg-primary text-white font-bold hover:bg-green-700 transition-colors";
const BTN_SECONDARY_CLS = "rounded-xl border border-border font-bold hover:bg-muted transition-colors";

async function handleNotificationToggle(
  currentlyOpen: boolean,
  setOpen: (v: boolean) => void,
  setItems: (v: any[] | null) => void,
  setUnread: (n: number) => void,
) {
  setOpen(!currentlyOpen);
  if (!currentlyOpen) {
    try {
      const n = await Waste2GoodsAPI.fetchNotifications();
      if (n && Array.isArray((n as any).items)) {
        setItems((n as any).items);
        setUnread(Number((n as any).unread || 0));
      }
    } catch {}
  }
}

interface PointAdjustParams {
  type: "Add" | "Deduct" | "Set";
  amountStr: string;
  reason: string;
  selectedUser: any;
  setSubmitting: (v: boolean) => void;
  setMsg: (v: { type: "ok" | "err"; text: string } | null) => void;
  setSelectedUserFn: (u: any) => void;
  setShowModal: (v: boolean) => void;
  refreshFn: () => Promise<void>;
}

async function handlePointAdjustSubmit(params: PointAdjustParams) {
  const { type, amountStr, reason, selectedUser, setSubmitting, setMsg, setSelectedUserFn, setShowModal, refreshFn } = params;
  setMsg(null);
  const amt = Math.max(0, Number(amountStr) || 0);
  const curBal = Number(selectedUser.points ?? selectedUser.pointsBalance ?? 0);
  const uid = String(selectedUser.userId || selectedUser.id || '');
  let delta = 0;
  if (type === 'Add') delta = amt;
  else if (type === 'Deduct') delta = -amt;
  else delta = amt - curBal;
  try {
    setSubmitting(true);
    const res = await Waste2GoodsAPI.adjustUserPoints(uid, delta, reason || 'Admin adjustment');
    if (!res || !(res as any).ok) throw new Error('API failed');
    const newBal = Number((res as any).newBalance ?? curBal + delta);
    setMsg({ type: 'ok', text: `Points updated! New balance: ${newBal.toLocaleString()} pts (${(res as any).delta >= 0 ? '+' : ''}${(res as any).delta}).` });
    setSelectedUserFn({ ...selectedUser, points: newBal, pointsBalance: newBal });
    await refreshFn();
    setTimeout(() => { setShowModal(false); setMsg(null); }, 1500);
  } catch (e) {
    setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Failed to adjust points. Is backend running on :3001 with MySQL?' });
  } finally { setSubmitting(false); }
}

function getSearchPlaceholder(section: string): string {
  if (section === "users") return "Search residents by name, email, or ID...";
  if (section === "rewards") return "Search rewards by name or category...";
  return "Search users, rewards, redemptions...";
}

function getNotifSeverityBg(severity: string): string {
  if (severity === "success") return "bg-green-100";
  if (severity === "danger") return "bg-red-100";
  return "bg-blue-100";
}

function getNotifIcon(type: string, severity: string) {
  if (type === "redemption") {
    const color = severity === "success" ? "text-green-600" : severity === "danger" ? "text-red-500" : "text-blue-600";
    return <ShoppingCart className={`w-4 h-4 ${color}`} />;
  }
  if (type === "newUser") {
    return <Users className="w-4 h-4 text-blue-600" />;
  }
  return <Award className="w-4 h-4 text-green-600" />;
}

function computeAdminDisplay(
  adminProfile: any | null,
  roleMap: Record<number, string>,
): { name: string; email: string; roleLabel: string; initials: string } {
  const prof = adminProfile || Waste2GoodsAPI.getAuthState()?.user || null;
  const name = prof?.name || "Juan Reyes";
  const email = prof?.email || prof?.adminIdentifier || "";
  const roleIdNum = Number(prof?.roleId ?? (prof?.role === "admin" ? 1 : 2));
  const roleLabel = roleMap[roleIdNum] || "Barangay Admin";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return { name, email, roleLabel, initials };
}

type AdminSection = "dashboard" | "users" | "users-detail" | "rewards" | "analytics" | "monitoring" | "admins";
type AppScreen = "login" | "admin";

type SettledResult<T> = { status: "fulfilled"; value: T } | { status: "rejected"; reason?: any };

const SETTLED_FULFILLED = "fulfilled";

type DashboardSummaryShape = {
  totalKg: number; activeResidents: number; pointsAwarded: number; redeemed: number;
  kgDelta: number; newUsers: number; redeemedDelta: number;
};

type AdminDataSetters = {
  setLiveUsers: (v: any[] | null) => void;
  setLiveRewards: (v: any[] | null) => void;
  setLiveKiosks: (v: any[] | null) => void;
  setLiveTx: (v: any[] | null) => void;
  setLiveWeekly: (v: any[] | null) => void;
  setLiveMonthly: (v: any[] | null) => void;
  setLiveLeaderboard: (v: any[] | null) => void;
  setLiveRedemptions: (v: any[] | null) => void;
  setDashboardSummary: (v: DashboardSummaryShape | null) => void;
  setNotifications: (v: any[] | null) => void;
  setNotifUnread: (n: number) => void;
  setAdminProfile: (v: any | null) => void;
  setProfileRefreshKey: (updater: (k: number) => number) => void;
};

function applySettledArray<T>(result: SettledResult<T>, setter: (v: T[] | null) => void) {
  if (result.status !== SETTLED_FULFILLED) return;
  setter(Array.isArray(result.value) ? result.value : null);
}

function buildDashboardSummary(raw: any): DashboardSummaryShape | null {
  if (!raw || typeof raw !== "object") return null;
  return {
    totalKg: Number(raw.totalKgCollected || raw.totalKg || raw.totalCollected || 0),
    activeResidents: Number(raw.activeResidents || raw.totalUsers || 0),
    pointsAwarded: Number(raw.totalPointsAwarded || raw.pointsAwarded || raw.totalPoints || 0),
    redeemed: Number(raw.rewardsRedeemed || raw.redeemed || 0),
    kgDelta: Number(raw.totalTransactions || raw.kgDelta || 0),
    newUsers: Number(raw.totalUsers || raw.newUsers || 0),
    redeemedDelta: Number(raw.rewardsRedeemed || raw.redeemedDelta || 0),
  };
}

function applyNotifications(notifs: SettledResult<any>, setters: Pick<AdminDataSetters, "setNotifications" | "setNotifUnread">) {
  if (notifs.status !== SETTLED_FULFILLED) return;
  const val = notifs.value as any;
  if (!val || !Array.isArray(val.items)) return;
  setters.setNotifications(val.items);
  setters.setNotifUnread(Number(val.unread || 0));
}

function applyAdminProfile(
  adminProf: SettledResult<any>,
  setters: Pick<AdminDataSetters, "setAdminProfile" | "setProfileRefreshKey">,
) {
  if (adminProf.status === SETTLED_FULFILLED && adminProf.value) {
    setters.setAdminProfile(adminProf.value);
    setters.setProfileRefreshKey(k => k + 1);
    return;
  }
  setters.setAdminProfile(Waste2GoodsAPI.getAuthState()?.user || null);
}

async function fetchAllAdminSettled(includeProfile: boolean) {
  const calls: Promise<any>[] = [
    Waste2GoodsAPI.fetchUsers(),
    Waste2GoodsAPI.fetchRewards(),
    Waste2GoodsAPI.fetchKiosks(),
    Waste2GoodsAPI.fetchTransactions(),
    Waste2GoodsAPI.fetchAnalyticsWeekly(),
    Waste2GoodsAPI.fetchAnalyticsMonthly(),
    Waste2GoodsAPI.fetchLeaderboard(),
    Waste2GoodsAPI.fetchRedemptions(),
    Waste2GoodsAPI.fetchAnalyticsSummary(),
    Waste2GoodsAPI.fetchNotifications(),
  ];
  if (includeProfile) {
    calls.push(Waste2GoodsAPI.refreshCurrentUser ? Waste2GoodsAPI.refreshCurrentUser() : Promise.resolve(null));
  }
  return Promise.allSettled(calls);
}

function applyAdminDataSet(
  results: SettledResult<any>[],
  setters: AdminDataSetters,
  hasProfile: boolean,
) {
  const [users, rewards, kiosks, tx, weekly, monthly, leaderboard, redemptions, summary, notifs, adminProf] = results;
  applySettledArray(users, setters.setLiveUsers);
  applySettledArray(rewards, setters.setLiveRewards);
  applySettledArray(kiosks, setters.setLiveKiosks);
  applySettledArray(tx, setters.setLiveTx);
  applySettledArray(weekly, setters.setLiveWeekly);
  applySettledArray(monthly, setters.setLiveMonthly);
  applySettledArray(leaderboard, setters.setLiveLeaderboard);
  applySettledArray(redemptions, setters.setLiveRedemptions);
  if (summary.status === SETTLED_FULFILLED) {
    setters.setDashboardSummary(buildDashboardSummary(summary.value));
  }
  applyNotifications(notifs, setters);
  if (hasProfile && adminProf) applyAdminProfile(adminProf, setters);
}

// Login Screen Component
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await Waste2GoodsAPI.login(email, password);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-border shadow-xl flex items-center justify-center" style={{ minHeight: STYLE_MIN_HEIGHT, background: STYLE_GRADIENT_DARK, fontFamily: STYLE_FONT_INTER }}>
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-green-100 border border-green-200 flex items-center justify-center mx-auto mb-4">
            <Recycle className="w-8 h-8 text-green-700" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Waste2Goods</h1>
          <p className="text-muted-foreground text-sm mt-2">Admin Panel Login</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-semibold">{error}</span>
            </div>
          )}
          <div>
            <label htmlFor="login-email" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="admin@waste2goods.ph"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="login-password" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Demo credentials: <span className="font-semibold">admin@waste2goods.ph</span> / <span className="font-semibold">AdminCabantian2025</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("login");
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // ── UI state: search, notifications, forms ──
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[] | null>(null);
  const [notifUnread, setNotifUnread] = useState(0);
  const [adjustType, setAdjustType] = useState<"Add" | "Deduct" | "Set">("Add");
  const [adjustAmount, setAdjustAmount] = useState<string>("100");
  const [adjustReason, setAdjustReason] = useState<string>("Community event participation");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustMsg, setAdjustMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  // ── Live data state (merged with demo fallbacks) ──
  const [liveUsers, setLiveUsers] = useState<Array<any> | null>(null);
  const [liveRewards, setLiveRewards] = useState<Array<any> | null>(null);
  const [liveKiosks, setLiveKiosks] = useState<Array<any> | null>(null);
  const [liveTx, setLiveTx] = useState<Array<any> | null>(null);
  const [liveWeekly, setLiveWeekly] = useState<Array<any> | null>(null);
  const [liveMonthly, setLiveMonthly] = useState<Array<any> | null>(null);
  const [liveRedemptions, setLiveRedemptions] = useState<Array<any> | null>(null);
  const [liveLeaderboard, setLiveLeaderboard] = useState<Array<any> | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<{
    totalKg: number; activeResidents: number; pointsAwarded: number; redeemed: number;
    kgDelta: number; newUsers: number; redeemedDelta: number;
  } | null>(null);
  // ── Admin profile state (reactive; refreshed from DB on mount / section change) ──
  const [adminProfile, setAdminProfile] = useState<any | null>(null);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  // Human-readable role labels from the roles table schema:
  //  roleId=1 Super Admin (full access), 2=Barangay Admin, 3=Secretary, 4=Treasurer
  const ROLE_NAME: Record<number, string> = {
    1: "Super Admin",
    2: "Barangay Admin",
    3: "Secretary",
    4: "Treasurer",
  };

  const dataSetters: AdminDataSetters = {
    setLiveUsers, setLiveRewards, setLiveKiosks, setLiveTx,
    setLiveWeekly, setLiveMonthly, setLiveLeaderboard, setLiveRedemptions,
    setDashboardSummary, setNotifications, setNotifUnread,
    setAdminProfile, setProfileRefreshKey,
  };

  // ── Refresh all modules from live DB (call after writes) ──
  const refreshData = async () => {
    try {
      const results = await fetchAllAdminSettled(true);
      applyAdminDataSet(results, dataSetters, true);
    } catch {
      setAdminProfile(Waste2GoodsAPI.getAuthState()?.user || null);
    }
  };

  // Fetch all modules whenever the section changes (and logged into admin)
  useEffect(() => {
    if (screen !== "admin") return;
    let cancelled = false;
    (async () => {
      try {
        const results = await fetchAllAdminSettled(false);
        if (cancelled) return;
        applyAdminDataSet(results, dataSetters, false);
      } catch {
        // If everything fails, still render (null falls cause demo used)
      }
    })();
    return () => { cancelled = true; };
  }, [screen, section]);

  // Clear any persisted auth on mount to force manual login
  useEffect(() => {
    Waste2GoodsAPI.logout();
  }, []);

  // AUTH GUARD: If screen === 'admin' but no real token is stored, force back to login screen.
  // (Prevents leftover stale state or tampering from showing the dashboard without auth.)
  useEffect(() => {
    if (screen !== "login") {
      const auth = Waste2GoodsAPI.getAuthState();
      if (!auth || !auth.isAuthenticated || !auth.token) {
        console.log("🔐 Auth guard: no valid token — returning to login screen");
        Waste2GoodsAPI.logout();
        setScreen("login");
      }
    }
  }, [screen]);

  const handleLogout = () => {
    Waste2GoodsAPI.logout();
    setScreen("login");
  };

  const navItems = [
    { id: "dashboard" as AdminSection, icon: <BarChart3 className="w-4 h-4" />, label: "Dashboard" },
    { id: "users" as AdminSection, icon: <Users className="w-4 h-4" />, label: "User Management" },
    { id: "rewards" as AdminSection, icon: <Gift className="w-4 h-4" />, label: "Reward Management" },
    { id: "analytics" as AdminSection, icon: <TrendingUp className="w-4 h-4" />, label: "Reports & Analytics" },
    { id: "monitoring" as AdminSection, icon: <Cpu className="w-4 h-4" />, label: "IoT Kiosk Monitor" },
    { id: "admins" as AdminSection, icon: <Shield className="w-4 h-4" />, label: "Admin Management" },
  ];

  // Show login screen if not authenticated
  if (screen === "login") {
    return <LoginScreen onLogin={() => setScreen("admin")} />;
  }

  // Admin profile data (reactive via adminProfile state; falls back to localStorage then defaults)
  // profileRefreshKey triggers re-read
  profileRefreshKey;
  const { name: adminName, email: adminEmail, roleLabel, initials } = computeAdminDisplay(adminProfile, ROLE_NAME);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-border shadow-xl" style={{ minHeight: STYLE_MIN_HEIGHT, fontFamily: STYLE_FONT_INTER }}>
      <div className="flex h-full" style={{ minHeight: STYLE_MIN_HEIGHT }}>
        {/* Sidebar */}
        <div className="w-60 flex-shrink-0 flex flex-col" style={{ background: STYLE_GRADIENT_DARK }}>
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                <Recycle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-sm leading-none">Waste2Goods</p>
                <p className="text-green-400 text-xs mt-0.5">Admin Panel v2.1</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-0.5">
            {navItems.map(item => (
              <button key={item.id} type="button" onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${section === item.id ? "bg-white/15 text-white shadow-sm" : "text-green-300 hover:bg-white/8 hover:text-white"}`}>
                {item.icon}{item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-black text-white flex-shrink-0">{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{adminName}</p>
                <p className="text-xs text-green-400" title={adminEmail}>{roleLabel}{adminEmail ? ` · ${adminEmail}` : ""}</p>
              </div>
              <LogOut className="w-4 h-4 text-green-400 cursor-pointer hover:text-white transition-colors" onClick={handleLogout} />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-green-300 font-semibold">System Online</span>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 bg-background flex flex-col overflow-hidden">
          <div className="px-6 py-3.5 bg-white border-b border-border flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="font-black text-foreground text-base leading-none">{navItems.find(n => n.id === section)?.label}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Cabantian Barangay · Jun 17, 2026</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 w-64"
                  placeholder={getSearchPlaceholder(section)}
                />
              </div>
              <button type="button" onClick={() => handleNotificationToggle(notificationsOpen, setNotificationsOpen, setNotifications, setNotifUnread)} className="relative p-2 rounded-xl border border-border hover:bg-muted transition-colors">
                <Bell className="w-4 h-4 text-muted-foreground" />
                {notifUnread > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">{Math.min(notifUnread, 9)}</span>}
              </button>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-black text-white">{initials}</div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 relative">
            {/* Notifications drawer */}
            {notificationsOpen && (
              <div className="absolute top-0 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-border z-40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div>
                    <h3 className="font-black text-sm text-foreground">Notifications</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{notifUnread} unread · from MySQL redemptions, users, transactions</p>
                  </div>
                  <button type="button" onClick={() => setNotificationsOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                <div className="max-h-96 overflow-auto divide-y divide-border">
                  {!notifications?.length && (
                    <div className="px-4 py-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                      <Bell className="w-8 h-8 text-muted-foreground/40" />
                      No notifications yet.
                    </div>
                  )}
                  {(notifications ?? []).slice(0, 20).map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotifSeverityBg(n.severity)}`}>
                          {getNotifIcon(n.type, n.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground leading-tight">{n.title || ''}</p>
                          {n.message && <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.time || Date.now()).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-border bg-muted/20">
                  <button type="button" onClick={() => refreshData()} className="w-full py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors flex items-center justify-center gap-1">
                    <RefreshCw className="w-3 h-3" />Refresh from DB
                  </button>
                </div>
              </div>
            )}

            {section === "dashboard" && (
              <AdminDashboard
                liveSummary={dashboardSummary}
                liveWeekly={liveWeekly}
                liveLeaderboard={liveLeaderboard}
                liveTx={liveTx}
              />
            )}
            {(section === "users" || section === "users-detail") && (
              <AdminUsers
                liveUsers={liveUsers}
                searchQuery={searchQuery}
                onRefresh={refreshData}
                onSelect={u => { setSelectedUser(u); setSection("users-detail"); }}
                selectedUser={section === "users-detail" ? selectedUser : null}
                onBack={() => setSection("users")}
                onAdjust={() => { setAdjustType("Add"); setAdjustAmount("100"); setAdjustMsg(null); setShowAdjustModal(true); }}
              />
            )}
            {section === "rewards" && <AdminRewards liveRewards={liveRewards} liveRedemptions={liveRedemptions} searchQuery={searchQuery} onRefresh={refreshData} />}
            {section === "analytics" && <AdminAnalytics liveWeekly={liveWeekly} liveMonthly={liveMonthly} liveRedemptions={liveRedemptions} />}
            {section === "monitoring" && <AdminMonitoring liveKiosks={liveKiosks} liveTx={liveTx} onRefresh={refreshData} />}
            {section === "admins" && <AdminAdmins />}
          </div>
        </div>
      </div>

      {/* Point Adjustment Modal */}
      {showAdjustModal && selectedUser && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-2xl">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-foreground">Adjust Points</h3>
              <button type="button" onClick={() => { setShowAdjustModal(false); setAdjustMsg(null); }}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Manually adjust points for <strong>{selectedUser.name}</strong> (current: <span className="font-black text-primary">{(selectedUser.points ?? selectedUser.pointsBalance ?? 0).toLocaleString()} pts</span>)</p>
            <div className="space-y-3">
              <div>
                <label htmlFor="adjust-type" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Adjustment Type</label>
                <select id="adjust-type" value={adjustType} onChange={e => setAdjustType(e.target.value as any)} className="w-full px-3 py-2.5 rounded-xl border border-border text-sm">
                  <option value="Add">Add Points</option><option value="Deduct">Deduct Points</option><option value="Set">Set Balance</option>
                </select>
              </div>
              <div>
                <label htmlFor="adjust-amount" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Amount</label>
                <input id="adjust-amount" type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label htmlFor="adjust-reason" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Reason</label>
                <input id="adjust-reason" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            {adjustMsg && (
              <div className={`mt-3 text-xs px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 ${adjustMsg.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {adjustMsg.type === 'ok' ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {adjustMsg.text}
              </div>
            )}
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => { setShowAdjustModal(false); setAdjustMsg(null); }} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">Cancel</button>
              <button
                type="button"
                disabled={adjustSubmitting}
                onClick={() => handlePointAdjustSubmit({ type: adjustType, amountStr: adjustAmount, reason: adjustReason, selectedUser, setSubmitting: setAdjustSubmitting, setMsg: setAdjustMsg, setSelectedUserFn: setSelectedUser, setShowModal: setShowAdjustModal, refreshFn: refreshData })}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >{adjustSubmitting ? 'Saving...' : 'Apply'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDemoVal(s: any, demoStr: string, unit?: string) {
  if (s === null || s === undefined || Number.isNaN(Number(s))) return demoStr;
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return demoStr;
  if (unit === "kg") return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg`;
  if (unit === "K") return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
  return n.toLocaleString();
}

function formatDashboardLeaderboard(liveLeaderboard: any[] | null) {
  if (!liveLeaderboard || liveLeaderboard.length === 0) {
    return leaderboard.slice(0, 5);
  }
  return liveLeaderboard.slice(0, 5).map((u, i) => ({
    rank: Number(u.rank) || i + 1,
    name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Resident",
    avatar: (u.name || "RU").split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase() || "RU",
    points: Number(u.points || u.pointsBalance || 0),
  }));
}

function formatDashboardTransactions(liveTx: any[] | null) {
  if (!liveTx || liveTx.length === 0) {
    return transactions.slice(0, 5);
  }
  return liveTx.slice(0, 5).map((t, i) => {
    const kg = Number(t.weightKg || t.kg || 0);
    const material = t.materialName || t.materialId || "PET Plastic";
    const kiosk = t.kioskId || "K-01";
    const pts = Number(t.pointsEarned || t.points || 0);
    const desc = pts > 0 ? `${material} · ${kg.toFixed(1)} kg · ${kiosk}` : t.desc || `Reward redemption`;
    const isEarn = pts > 0 && t.pointsEarned !== undefined ? true : (t.type === "earn");
    return {
      id: t.transactionId || t.id || `tx-${i}`,
      date: t.timestamp || t.date || "Today",
      type: isEarn ? "earn" : (t.type || "earn"),
      desc,
      pts: pts || 0,
    };
  });
}

function DashboardSummaryCards({ liveSummary }: { liveSummary: any }) {
  const totalCollectedStr = liveSummary ? formatDemoVal(liveSummary.totalKg, "12,450 kg", "kg") : "12,450 kg";
  const activeResidentsStr = liveSummary ? formatDemoVal(liveSummary.activeResidents, "847") : "847";
  const pointsAwardedStr = liveSummary ? formatDemoVal(liveSummary.pointsAwarded, "284.5K", "K") : "284.5K";
  const redeemedStr = liveSummary ? formatDemoVal(liveSummary.redeemed, "234") : "234";

  return (
    <div className="grid grid-cols-4 gap-4">
      <SCard label="Total Collected" value={totalCollectedStr} sub={liveSummary ? `From ${liveSummary.kgDelta || 0} total recycling transactions` : "↑ 18% vs May"} icon={<Scale className="w-5 h-5 text-green-600" />} color="bg-green-100" trend={liveSummary && liveSummary.kgDelta > 0 ? `Tx:${liveSummary.kgDelta}` : "+18%"} />
      <SCard label="Active Residents" value={activeResidentsStr} sub={liveSummary ? `${liveSummary.newUsers || 0} registered users (DB total)` : "34 new this week"} icon={<Users className="w-5 h-5 text-blue-600" />} color="bg-blue-100" trend={liveSummary && liveSummary.newUsers > 0 ? `Users:${liveSummary.newUsers}` : "+34"} />
      <SCard label="Points Awarded" value={pointsAwardedStr} sub="All time points distributed" icon={<Award className="w-5 h-5 text-amber-600" />} color="bg-amber-100" />
      <SCard label="Rewards Redeemed" value={redeemedStr} sub={liveSummary ? `Total redemptions processed` : "All time total"} icon={<ShoppingCart className="w-5 h-5 text-purple-600" />} color="bg-purple-100" trend={liveSummary && liveSummary.redeemedDelta > 0 ? `Redeemed:${liveSummary.redeemedDelta}` : "+41"} />
    </div>
  );
}

function WeeklyCollectionCard({ liveWeekly }: { liveWeekly: any[] | null }) {
  const mergedWeekly = liveWeekly && liveWeekly.length > 0 ? liveWeekly : weeklyData;
  const isLive = Boolean(liveWeekly && liveWeekly.length > 0);

  return (
    <div className="col-span-3 bg-white rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-sm text-foreground">Weekly Collection (kg)</h3>
        {isLive ? <span className={`text-[10px] px-2 py-1 rounded-full ${BADGE_SUCCESS_CLS} font-bold`}>● LIVE from DB</span> : <span className={`text-[10px] px-2 py-1 rounded-full ${BADGE_WARN_CLS} font-bold`}>DEMO</span>}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={mergedWeekly}>
          <defs>
            <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11, border: "1px solid #e5e7eb" }} />
          <Area type="monotone" dataKey="kg" stroke="#16a34a" strokeWidth={2.5} fill="url(#wg)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function WasteCompositionCard() {
  return (
    <div className="col-span-2 bg-white rounded-2xl p-4 border border-border">
      <h3 className="font-black text-sm text-foreground mb-3">Waste Composition</h3>
      <ResponsiveContainer width="100%" height={130}>
        <PieChart>
          <Pie data={wasteTypes} cx="50%" cy="50%" innerRadius={32} outerRadius={55} dataKey="value" paddingAngle={3}>
            {wasteTypes.map((e) => <Cell key={e.name} fill={e.color} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1 mt-1">
        {wasteTypes.map(w => (
          <div key={w.name} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: w.color }} />
            <span className="text-muted-foreground flex-1 truncate">{w.name}</span>
            <span className="font-bold">{w.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopResidentsCard({ liveLeaderboard }: { liveLeaderboard: any[] | null }) {
  const mergedLeaderboard = formatDashboardLeaderboard(liveLeaderboard);
  const isLive = Boolean(liveLeaderboard && liveLeaderboard.length > 0);

  return (
    <div className="bg-white rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-sm text-foreground">Top Residents</h3>
        {isLive ? <span className={`text-[10px] px-2 py-1 rounded-full ${BADGE_SUCCESS_CLS} font-bold`}>● LIVE</span> : <span className={`text-[10px] px-2 py-1 rounded-full ${BADGE_WARN_CLS} font-bold`}>DEMO</span>}
      </div>
      <div className="space-y-2">
        {mergedLeaderboard.map(u => (
          <div key={String(u.rank)} className="flex items-center gap-2">
            <RankIcon rank={u.rank} />
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-black text-white flex-shrink-0">{u.avatar}</div>
            <span className="text-xs font-semibold flex-1 truncate">{u.name}</span>
            <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (u.points / Math.max(5000, u.points)) * 100)}%` }} /></div>
            <span className="text-xs font-black text-primary w-16 text-right">{Number(u.points || 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getTxBadgeBg(type: string): string {
  if (type === "earn") return "bg-green-100";
  if (type === "redeem") return "bg-blue-100";
  return "bg-amber-100";
}

function getTxIcon(type: string) {
  if (type === "earn") return <Recycle className="w-3 h-3 text-green-600" />;
  if (type === "redeem") return <Gift className="w-3 h-3 text-blue-600" />;
  return <Zap className="w-3 h-3 text-amber-600" />;
}

function RecentActivityCard({ liveTx }: { liveTx: any[] | null }) {
  const mergedTx = formatDashboardTransactions(liveTx);
  const isLive = Boolean(liveTx && liveTx.length > 0);

  return (
    <div className="bg-white rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-sm text-foreground">Recent Activity</h3>
        {isLive ? <span className={`text-[10px] px-2 py-1 rounded-full ${BADGE_SUCCESS_CLS} font-bold`}>● LIVE</span> : <span className={`text-[10px] px-2 py-1 rounded-full ${BADGE_WARN_CLS} font-bold`}>DEMO</span>}
      </div>
      <div className="space-y-2">
        {mergedTx.map(t => (
          <div key={String(t.id)} className="flex items-center gap-2 py-1 border-b border-border last:border-0">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${getTxBadgeBg(t.type)}`}>
              {getTxIcon(t.type)}
            </div>
            <div className="flex-1 min-w-0"><p className="text-xs font-semibold truncate">{t.desc}</p><p className="text-xs text-muted-foreground">{String(t.date)}</p></div>
            <span className={`text-xs font-black ${t.pts > 0 ? "text-primary" : "text-red-500"}`}>{t.pts > 0 ? "+" : ""}{t.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminDashboard({
  liveSummary,
  liveWeekly,
  liveLeaderboard,
  liveTx,
}: {
  liveSummary: null | { totalKg: number; activeResidents: number; pointsAwarded: number; redeemed: number; kgDelta: number; newUsers: number; redeemedDelta: number; };
  liveWeekly: any[] | null;
  liveLeaderboard: any[] | null;
  liveTx: any[] | null;
}) {
  return (
    <div className="space-y-5">
      <DashboardSummaryCards liveSummary={liveSummary} />
      <div className="grid grid-cols-5 gap-4">
        <WeeklyCollectionCard liveWeekly={liveWeekly} />
        <WasteCompositionCard />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TopResidentsCard liveLeaderboard={liveLeaderboard} />
        <RecentActivityCard liveTx={liveTx} />
      </div>
    </div>
  );
}

function AdminUsers({ liveUsers, searchQuery = "", onRefresh, onSelect, selectedUser, onBack, onAdjust }: { liveUsers: any[] | null; searchQuery?: string; onRefresh?: () => Promise<void>; onSelect: (u: any) => void; selectedUser: any | null; onBack: () => void; onAdjust: () => void }) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uFirst, setUFirst] = useState("");
  const [uLast, setULast] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uPass, setUPass] = useState("");
  const [uPass2, setUPass2] = useState("");
  const [uPhone, setUPhone] = useState("");
  const [uPoints, setUPoints] = useState<string>("0");

  const resetForm = () => {
    setUFirst(""); setULast(""); setUEmail(""); setUPass(""); setUPass2(""); setUPhone(""); setUPoints("0"); setBanner(null);
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setUFirst(u.firstName || "");
    setULast(u.lastName || "");
    setUEmail(u.email || "");
    setUPass("");
    setUPass2("");
    setUPhone(u.phone || u.contactInfo || "");
    setUPoints(String(u.points ?? u.pointsBalance ?? 0));
    setShowEditForm(true);
  };

  const submitEdit = async () => {
    setBanner(null);
    if (!editUser) return;
    if (!uFirst.trim() || !uLast.trim() || !uEmail.trim()) { setBanner({ type: "err", text: "First name, last name, and email are required." }); return; }
    const uid = String(editUser.userId || editUser.id);
    try {
      setSaving(true);
      const payload: any = { firstName: uFirst.trim(), lastName: uLast.trim(), email: uEmail.trim(), phone: uPhone.trim(), pointsBalance: Number(uPoints) || 0 };
      if (uPass) {
        if (uPass.length < 6) { setBanner({ type: "err", text: "Password must be at least 6 characters." }); return; }
        if (uPass !== uPass2) { setBanner({ type: "err", text: "Passwords do not match." }); return; }
        payload.passwordHash = `hashed_${uPass}`;
      }
      const res = await Waste2GoodsAPI.updateUser(uid, payload);
      if (!res || !(res as any).ok) throw new Error("User update failed");
      setBanner({ type: "ok", text: `User ${uFirst} ${uLast} updated successfully!` });
      if (onRefresh) await onRefresh();
      setTimeout(() => { setShowEditForm(false); setEditUser(null); resetForm(); }, 1500);
    } catch (e) {
      setBanner({ type: "err", text: e instanceof Error ? e.message : "Update failed. Is backend running with MySQL?" });
    } finally { setSaving(false); }
  };

  const toggleStatus = async (u: any) => {
    const uid = String(u.userId || u.id);
    try {
      const nextStatus = String(u.status || "active").toLowerCase() === "active" ? "inactive" : "active";
      const res = await Waste2GoodsAPI.updateUser(uid, { status: nextStatus });
      if (res && (res as any).ok && onRefresh) await onRefresh();
    } catch {}
  };

  const exportCSV = () => {
    const rows = [["User ID","Name","Barangay","Email","Phone","Points","Submissions","Joined","Status"]];
    mergedUsers.forEach((u: any) => rows.push([u.userId || u.id, u.name || "", u.barangay || "", u.email || "", u.phone || "", String(u.points || 0), String(u.submissions || 0), u.joined || "", u.status || ""]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `waste2goods-users-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

function formatUserJoinedDate(rawJoined: any): string {
  if (!rawJoined) return "May 14, 2025";
  if (typeof rawJoined !== "string") {
    return new Date(Number(rawJoined)).toLocaleDateString();
  }
  if (rawJoined.includes("T")) {
    return new Date(rawJoined).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return rawJoined;
}

  // Merge: live DB users first (convert to UI shape), fall back to demo adminUsers array when not available.
  let mergedUsers: any[] = liveUsers && liveUsers.length > 0
    ? liveUsers.map((u: any, i: number) => {
        const name = u.name || `${u.firstName || "Resident"} ${u.lastName || String(i + 1)}`.trim();
        const barangay = u.barangayName || u.barangay || "Cabantian";
        const points = Number(u.pointsBalance || u.points || 0);
        const submissions = Number(u.totalSubmissions || u.submissions || 0);
        const redeemed = Number(u.redeemed || 0);
        const rawJoined = u.createdAt || u.joined || u.registrationDate;
        const joined = formatUserJoinedDate(rawJoined);
        const statusBase = String(u.status || (points > 0 || submissions > 0 ? "active" : "inactive")).toLowerCase();
        const status = statusBase === "active" || statusBase === "inactive" ? statusBase : "active";
        const id = u.userId || u.id || `U-${String(1000 + i).padStart(4, "0")}`;
        const email = u.email || "";
        const phone = u.contactInfo || u.phone || "";
        return {
          id, userId: id, email, phone,
          firstName: u.firstName || name.split(" ")[0] || "",
          lastName: u.lastName || name.split(" ").slice(1).join(" ") || "",
          name, barangay, points, submissions, redeemed,
          joined, status,
        };
      })
    : adminUsers.slice();

  // Apply search filter (name, email, id, barangay)
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    mergedUsers = mergedUsers.filter((u: any) =>
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.id || "").toLowerCase().includes(q) ||
      (u.userId || "").toLowerCase().includes(q) ||
      (u.barangay || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q)
    );
  }

  // users array for export (fallback)
  const users = mergedUsers;

  if (selectedUser) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="font-black text-foreground">User Profile</h2>
          {banner && (
            <div className={`ml-auto text-xs px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 ${banner.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {banner.type === 'ok' ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}{banner.text}
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 bg-white rounded-2xl border border-border p-5 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-xl font-black text-white">
              {selectedUser.name.split(" ").map((n: string)=>n[0]).join("").slice(0,2)}
            </div>
            <div>
              <p className="font-black text-foreground">{selectedUser.name}</p>
              <p className="text-xs text-muted-foreground">{selectedUser.barangay}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Joined {selectedUser.joined}</p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${selectedUser.status==="active" ? BADGE_SUCCESS_CLS : "bg-gray-100 text-gray-500"}`}>
              <StatusPip status={selectedUser.status} />{selectedUser.status}
            </span>
            <div className="w-full space-y-1.5 text-xs">
              {selectedUser.email && <p className="flex items-center gap-1 justify-center"><Mail className="w-3 h-3 text-muted-foreground" />{selectedUser.email}</p>}
              {selectedUser.phone && <p className="flex items-center gap-1 justify-center text-muted-foreground">📞 {selectedUser.phone}</p>}
              <p className="flex items-center gap-1 justify-center text-muted-foreground">ID: {selectedUser.userId || selectedUser.id}</p>
            </div>
            <button type="button" onClick={onAdjust} className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Adjust Points
            </button>
            <button type="button" onClick={() => openEdit(selectedUser)} className="w-full py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors flex items-center justify-center gap-1.5">
              <Edit className="w-3.5 h-3.5" /> Edit Profile
            </button>
            <button type="button" onClick={() => toggleStatus(selectedUser)} className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${selectedUser.status==="active" ? BADGE_DANGER_CLS + " hover:bg-red-100" : BADGE_OK_CLS + " hover:bg-green-100"}`}>
              {selectedUser.status==="active" ? "🚫 Suspend User" : "✅ Reactivate User"}
            </button>
          </div>
          <div className="col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[["Points Balance", (selectedUser.points ?? selectedUser.pointsBalance ?? 0).toLocaleString()+" pts","text-primary"],["Submissions",(selectedUser.submissions??0)+" times","text-blue-600"],["Redeemed",(selectedUser.redeemed??0)+" items","text-purple-600"]].map(([l,v,c]) => (
                <div key={String(l)} className="bg-white rounded-2xl border border-border p-3 text-center">
                  <p className={`text-xl font-black ${c}`}>{v}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{l}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-border p-4">
              <h3 className="font-black text-sm mb-3">Recent Transactions</h3>
              <div className="space-y-1.5">
                {transactions.slice(0,4).map(t => (
                  <div key={t.id} className="flex items-center gap-2 py-1 border-b border-border last:border-0 text-xs">
                    <span className="text-muted-foreground">{t.date}</span>
                    <span className="flex-1 truncate font-semibold">{t.desc}</span>
                    <span className={`font-black ${t.pts>0?"text-primary":"text-red-500"}`}>{t.pts>0?"+":""}{t.pts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-foreground">{mergedUsers.length} registered residents <span className={`text-[10px] ml-1 px-2 py-0.5 rounded-full font-bold ${liveUsers && liveUsers.length > 0 ? BADGE_SUCCESS_CLS : BADGE_WARN_CLS}`}>{liveUsers && liveUsers.length > 0 ? "● LIVE DB" : "DEMO FALLBACK"}</span></p>
          <p className="text-xs text-muted-foreground">Cabantian Barangay — real MySQL users table (users sign up via Mobile App){searchQuery ? ` · filtered for "${searchQuery}"` : ""}</p>
        </div>
        <div className="flex gap-2">
          {onRefresh && <button type="button" onClick={onRefresh} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold hover:bg-muted transition-colors"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>}
          <button type="button" onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold hover:bg-muted transition-colors"><Download className="w-3.5 h-3.5" />Export</button>
        </div>
      </div>

      {banner && (
        <div className={`text-xs px-4 py-3 rounded-2xl font-semibold flex items-center gap-1.5 ${banner.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {banner.type === 'ok' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{banner.text}
        </div>
      )}

      {showEditForm && editUser && (
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="font-black text-foreground">Edit Resident · {editUser.name || editUser.userId || ''}</h3>
              <p className="text-xs text-muted-foreground">Update profile, contact info, password, or points balance</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="user-edit-first" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">First Name *</label>
              <input id="user-edit-first" value={uFirst} onChange={e => setUFirst(e.target.value)} placeholder="Juan" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div>
              <label htmlFor="user-edit-last" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Last Name *</label>
              <input id="user-edit-last" value={uLast} onChange={e => setULast(e.target.value)} placeholder="Reyes" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div className="col-span-2">
              <label htmlFor="user-edit-email" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input id="user-edit-email" type="email" value={uEmail} onChange={e => setUEmail(e.target.value)} placeholder="resident@example.com" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="user-edit-pass" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">New Password (leave blank to keep)</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input id="user-edit-pass" type="password" value={uPass} onChange={e => setUPass(e.target.value)} placeholder="Min 6 chars (optional)" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="user-edit-pass2" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input id="user-edit-pass2" type="password" value={uPass2} onChange={e => setUPass2(e.target.value)} placeholder="Only if updating password" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="user-edit-phone" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Phone</label>
              <input id="user-edit-phone" value={uPhone} onChange={e => setUPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div>
              <label htmlFor="user-edit-points" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Points Balance</label>
              <input id="user-edit-points" type="number" value={uPoints} onChange={e => setUPoints(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowEditForm(false); setEditUser(null); resetForm(); }} className="px-5 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
            <button type="button" disabled={saving} onClick={submitEdit} className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Resident","Barangay","Points","Submissions","Joined","Status","Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 font-black text-muted-foreground uppercase tracking-wide" style={{ fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mergedUsers.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-xs text-muted-foreground">{searchQuery ? `No results for "${searchQuery}".` : "No users."}</td></tr>
            )}
            {mergedUsers.map(u => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => onSelect(u)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-black text-white flex-shrink-0">{u.name.split(" ").map((n: string)=>n[0]).join("").slice(0,2)}</div>
                    <div><p className="font-semibold text-foreground">{u.name}</p><p className="text-muted-foreground">{u.id}{u.email ? ` · ${u.email}` : ""}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.barangay}</td>
                <td className="px-4 py-3"><span className="font-black text-primary">{u.points.toLocaleString()}</span></td>
                <td className="px-4 py-3 font-semibold">{u.submissions}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.joined}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${u.status==="active" ? BADGE_SUCCESS_CLS : "bg-gray-100 text-gray-500"}`}>
                    <StatusPip status={u.status} />{u.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button type="button" onClick={() => onSelect(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => toggleStatus(u)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title={u.status==="active" ? "Suspend" : "Reactivate"}>{u.status==="active" ? <Trash2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function getRewardSubmitButtonText(saving: boolean, editing: boolean): string {
  if (saving) return "Saving...";
  return editing ? "Save Changes" : "Create Reward";
}

function AdminRewards({ liveRewards, liveRedemptions, searchQuery = "", onRefresh }: { liveRewards: any[] | null; liveRedemptions: any[] | null; searchQuery?: string; onRefresh?: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [restock, setRestock] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<any | null>(null);
  const [rName, setRName] = useState("");
  const [rPoints, setRPoints] = useState<string>("100");
  const [rStock, setRStock] = useState<string>("0");
  const [rDesc, setRDesc] = useState("");
  const [rCat, setRCat] = useState("Eco Essentials");
  const [rIcon, setRIcon] = useState("🎁");
  const [rSeasonal, setRSeasonal] = useState(false);
  const [rRestockQty, setRRestockQty] = useState<string>("50");

  const resetForm = () => {
    setRName(""); setRPoints("100"); setRStock("0"); setRDesc(""); setRCat("Eco Essentials"); setRIcon("🎁"); setRSeasonal(false);
  };

  const openCreate = () => { resetForm(); setEditing(null); setBanner(null); setShowForm(true); };
  const openEdit = (rw: any) => {
    setEditing(rw);
    setRName(rw.rewardName || rw.name || "");
    setRPoints(String(rw.pointsCost ?? rw.points ?? 0));
    setRStock(String(rw.stockQuantity ?? rw.stock ?? rw.stockCount ?? 0));
    setRDesc(rw.description || "");
    setRCat(rw.category || "Eco Essentials");
    setRIcon(rw.icon || "🎁");
    setRSeasonal(Boolean(rw.isSeasonal || rw.seasonal));
    setBanner(null); setShowForm(true);
  };

  const submitForm = async () => {
    setBanner(null);
    if (!rName.trim() || Number(rPoints) < 0) { setBanner({ type: "err", text: "Reward name and a valid points cost are required." }); return; }
    const payload: any = {
      rewardName: rName.trim(),
      pointsCost: Number(rPoints) || 0,
      stockQuantity: Number(rStock) || 0,
      description: rDesc.trim(),
      category: rCat.trim() || "Uncategorized",
      icon: rIcon.trim() || "🎁",
      isSeasonal: rSeasonal ? 1 : 0,
      status: "active",
    };
    try {
      setSaving(true);
      let res: any;
      if (editing) {
        const rid = Number(editing.rewardId ?? editing.id ?? 0);
        if (!rid) throw new Error("Missing reward ID");
        res = await Waste2GoodsAPI.updateReward(rid, payload);
      } else {
        res = await Waste2GoodsAPI.createReward(payload);
      }
      if (!res || !(res as any).ok) throw new Error((res as any)?.error || "Reward save failed");
      setBanner({ type: "ok", text: editing ? `Reward "${rName}" updated successfully!` : `Reward "${rName}" created (ID: ${(res as any).reward?.rewardId || 'NEW'}).` });
      if (onRefresh) await onRefresh();
      setTimeout(() => { setShowForm(false); setEditing(null); resetForm(); }, 1500);
    } catch (e) {
      setBanner({ type: "err", text: e instanceof Error ? e.message : "Save failed. Run backend with MySQL." });
    } finally { setSaving(false); }
  };

  const submitRestock = async () => {
    if (!restock) return;
    setBanner(null);
    const rid = Number(restock.rewardId ?? restock.id ?? 0);
    const curStock = Number(restock.stockQuantity ?? restock.stock ?? restock.stockCount ?? 0);
    const add = Math.max(0, Number(rRestockQty) || 0);
    try {
      setSaving(true);
      const res = await Waste2GoodsAPI.updateReward(rid, { stockQuantity: curStock + add });
      if (!res || !(res as any).ok) throw new Error("Restock failed");
      setBanner({ type: "ok", text: `Restocked! Added ${add} to "${restock.rewardName || restock.name || ''}" (now: ${curStock + add} stock).` });
      if (onRefresh) await onRefresh();
      setTimeout(() => { setRestock(null); setRRestockQty("50"); }, 1200);
    } catch (e) {
      setBanner({ type: "err", text: e instanceof Error ? e.message : "Restock failed." });
    } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!confirmDel) return;
    setBanner(null);
    try {
      const rid = Number(confirmDel.rewardId ?? confirmDel.id ?? 0);
      if (!rid) throw new Error("Missing reward ID");
      const res = await Waste2GoodsAPI.deleteReward(rid);
      if (!res || !(res as any).ok) throw new Error("Delete failed");
      setBanner({ type: "ok", text: `Reward "${confirmDel.rewardName || confirmDel.name || ''}" deleted / archived.` });
      if (onRefresh) await onRefresh();
    } catch (e) {
      setBanner({ type: "err", text: e instanceof Error ? e.message : "Delete failed." });
    } finally { setConfirmDel(null); }
  };

  let mergedRewards: any[] = liveRewards && liveRewards.length > 0
    ? liveRewards.map((r, i) => {
        const rid = Number(r.rewardId ?? r.id ?? i + 1);
        return {
          id: rid,
          rewardId: rid,
          icon: r.icon || "🎁",
          rewardName: r.rewardName || r.name || `Reward ${i + 1}`,
          name: r.rewardName || r.name || `Reward ${i + 1}`,
          description: r.description || "",
          category: r.category || "Essentials",
          points: Number(r.pointsCost || r.points || 0),
          pointsCost: Number(r.pointsCost || r.points || 0),
          stock: Number(r.stockQuantity ?? r.stock ?? r.stockCount ?? 0),
          stockQuantity: Number(r.stockQuantity ?? r.stock ?? r.stockCount ?? 0),
          seasonal: Boolean(r.isSeasonal ?? r.seasonal ?? false),
          isSeasonal: Boolean(r.isSeasonal ?? r.seasonal ?? false),
          status: r.status || 'active',
        };
      })
    : rewards.slice();

  // Apply search filter (name, desc, category, icon)
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    mergedRewards = mergedRewards.filter((r: any) =>
      (r.name || "").toLowerCase().includes(q) ||
      (r.category || "").toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q) ||
      String(r.rewardId || r.id || "").includes(q)
    );
  }

  const redeemedCounts: Record<string, number> = {};
  (liveRedemptions || []).forEach(rr => {
    const key = String(rr.rewardId || rr.rewardName || "");
    redeemedCounts[key] = (redeemedCounts[key] || 0) + Number(rr.quantity || 1);
  });
  const totalLiveRedemptions = (liveRedemptions || []).length;
  const ICON_CHOICES = ["🥤","🥢","👜","🛍️","📓","✏️","🖊️","🍚","🍜","🐟","☕","🧂","🧺","🧽","🧼","🪥","🧸","🌟","🎨","🌱","👕","🎊","🎁","🎄","🥬","🧃","📱","🪴","🎟️","🎒","🖼️","🎮"];
  const CAT_CHOICES = ["Eco Essentials","School Supplies","Groceries","Household","Kids","Community","Seasonal","Other"];

  return (
    <div className="space-y-4 relative">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-foreground">{mergedRewards.length} reward items <span className={`text-[10px] ml-1 px-2 py-0.5 rounded-full font-bold ${liveRewards && liveRewards.length > 0 ? BADGE_SUCCESS_CLS : BADGE_WARN_CLS}`}>{liveRewards && liveRewards.length > 0 ? "● LIVE DB" : "DEMO"}</span></p>
          <p className="text-xs text-muted-foreground">{mergedRewards.filter((r: any) => !!r.seasonal).length} seasonal · {mergedRewards.filter((r: any) => Number(r.stock) < 10).length} low stock · {totalLiveRedemptions} redemptions{searchQuery ? ` · filter "${searchQuery}"` : ""}</p>
        </div>
        <div className="flex gap-2">
          {onRefresh && <button type="button" onClick={() => onRefresh()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold hover:bg-muted transition-colors"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>}
          <button type="button" onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-green-700 transition-colors"><Plus className="w-3.5 h-3.5" />Add Reward</button>
        </div>
      </div>

      {banner && (
        <div className={`text-xs px-4 py-3 rounded-2xl font-semibold flex items-center gap-1.5 ${banner.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {banner.type === 'ok' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{banner.text}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">{rIcon}</div>
              <div>
                <h3 className="font-black text-foreground">{editing ? "Edit Reward" : "Add New Reward"}</h3>
                <p className="text-xs text-muted-foreground">Saved to MySQL `rewards` table immediately</p>
              </div>
            </div>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); resetForm(); }} className="text-xs font-bold text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="reward-name" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Reward Name *</label>
              <input id="reward-name" value={rName} onChange={e => setRName(e.target.value)} placeholder="Eco Water Bottle" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div>
              <label htmlFor="reward-points" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Points Cost *</label>
              <input id="reward-points" type="number" value={rPoints} onChange={e => setRPoints(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div>
              <label htmlFor="reward-stock" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Stock Quantity</label>
              <input id="reward-stock" type="number" value={rStock} onChange={e => setRStock(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div className="col-span-2">
              <label htmlFor="reward-desc" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Short Description</label>
              <textarea id="reward-desc" value={rDesc} onChange={e => setRDesc(e.target.value)} rows={2} placeholder="Describe the reward..." className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none" />
            </div>
            <div>
              <label htmlFor="reward-cat" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Category</label>
              <select id="reward-cat" value={rCat} onChange={e => setRCat(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm">
                {CAT_CHOICES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="reward-icon" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Icon Emoji</label>
              <div className="relative">
                <select id="reward-icon" value={rIcon} onChange={e => setRIcon(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm appearance-none">
                  {ICON_CHOICES.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input type="checkbox" checked={rSeasonal} onChange={e => setRSeasonal(e.target.checked)} /> Mark as Seasonal reward
              </label>
              <span className="text-xs text-muted-foreground">(displayed with seasonal badge)</span>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); resetForm(); }} className="px-5 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
            <button type="button" disabled={saving} onClick={submitForm} className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">
              {getRewardSubmitButtonText(saving, Boolean(editing))}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {mergedRewards.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-2 relative">
            <div className="flex items-start justify-between">
              <span className="text-3xl">{r.icon}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => openEdit(r)} className="p-1 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                <button type="button" onClick={() => setConfirmDel(r)} className="p-1 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            {r.seasonal && <span className={`absolute top-3 left-3 text-xs font-bold px-1.5 py-0.5 rounded-full ${BADGE_WARN_CLS}`}>Seasonal</span>}
            <div className="mt-1">
              <p className="text-xs font-black text-foreground leading-tight">{r.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.category}{r.description && <span> · {r.description.slice(0, 30)}{r.description.length > 30 ? "…" : ""}</span>}</p>
            </div>
            <div className="flex justify-between text-xs mt-auto">
              <div><p className="text-muted-foreground">Cost</p><p className="font-black text-primary">{r.points} pts</p></div>
              <div className="text-right"><p className="text-muted-foreground">Stock</p><p className={`font-black ${Number(r.stock)<10?"text-red-500":"text-foreground"}`}>{r.stock}</p></div>
            </div>
            {Number(r.stock) < 10 && <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 p-1.5 rounded-lg"><AlertCircle className="w-3 h-3" />Low stock</div>}
            <div className="flex gap-1.5 pt-1">
              <button type="button" onClick={() => openEdit(r)} className="flex-1 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors flex items-center justify-center gap-1"><Edit className="w-3 h-3" />Edit</button>
              <button type="button" onClick={() => { setRestock(r); setRRestockQty("50"); }} className="flex-1 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-green-700 transition-colors">Restock</button>
            </div>
          </div>
        ))}
        {mergedRewards.length === 0 && (
          <div className="col-span-4 bg-white rounded-2xl border border-border p-10 text-center text-xs text-muted-foreground">
            <Gift className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
            {searchQuery ? `No rewards match "${searchQuery}".` : "No rewards. Click Add Reward to create one."}
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {restock && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-2xl">
          <div className="bg-white rounded-2xl p-5 w-80 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-foreground">Restock Reward</h3>
              <button type="button" onClick={() => setRestock(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="flex items-center gap-3 mb-4 bg-muted/30 p-3 rounded-xl">
              <span className="text-3xl">{restock.icon}</span>
              <div className="min-w-0">
                <p className="font-black text-sm text-foreground truncate">{restock.rewardName || restock.name || 'Reward'}</p>
                <p className="text-xs text-muted-foreground">Current stock: <span className="font-black text-foreground">{Number(restock.stockQuantity ?? restock.stock ?? 0)}</span></p>
              </div>
            </div>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Quantity to add</label>
            <input type="number" value={rRestockQty} onChange={e => setRRestockQty(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm mb-4" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setRestock(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
              <button type="button" disabled={saving} onClick={submitRestock} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-60">{saving ? "Saving..." : "Restock"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDel && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-2xl">
          <div className="bg-white rounded-2xl p-5 w-80 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              <div>
                <h3 className="font-black text-foreground">Delete Reward?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{confirmDel.rewardName || confirmDel.name || ''}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Existing redemptions are preserved (FK constraint). Will try hard delete, or mark inactive if needed.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
              <button type="button" onClick={doDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminAnalytics({ liveWeekly, liveMonthly, liveRedemptions }: { liveWeekly: any[] | null; liveMonthly: any[] | null; liveRedemptions: any[] | null }) {
  const mergedWeekly = liveWeekly && liveWeekly.length > 0 ? liveWeekly : weeklyData;
  const mergedMonthly = liveMonthly && liveMonthly.length > 0 ? liveMonthly : monthlyData;
  const redeemed = (liveRedemptions || []).length;

  const exportAnalyticsCSV = () => {
    const rows = [["Dataset","Key","Collected (kg)","Redeemed","Active Users","Notes"]];
    mergedMonthly.forEach((m: any) => rows.push(["Monthly", m.month || m.label || "", String(m.collected || m.kg || 0), String(m.redeemed || 0), String(m.users || 0), m.note || ""]));
    mergedWeekly.forEach((w: any, i: number) => rows.push(["Weekly", w.week || w.label || `Week ${i+1}`, String(w.kg || w.collected || 0), String(w.redeemed || 0), String(w.users || 0), w.note || ""]));
    (liveRedemptions || []).slice(0, 50).forEach((r: any) => rows.push(["Redemption", r.redemptionId || r.id || "", String(r.weightKg || 0), String(r.quantity || 1), String(r.userId || ""), r.rewardName || r.status || ""]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `waste2goods-analytics-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <SCard label="Avg. kg per user" value={liveWeekly && liveWeekly.length > 0 ? `${(liveWeekly.reduce((a: any, b: any) => a + Number(b.kg || 0), 0) / Math.max(1, liveWeekly.length)).toFixed(1)} kg` : "14.7 kg"} sub="Weekly avg." icon={<Scale className="w-5 h-5 text-green-600" />} color="bg-green-100" trend={liveWeekly && liveWeekly.length > 0 ? "LIVE" : "+2.1"} />
        <SCard label="Redemptions Total" value={String(redeemed || 234)} sub={liveRedemptions && liveRedemptions.length > 0 ? "Actual from DB" : "Demo value"} icon={<ShoppingCart className="w-5 h-5 text-purple-600" />} color="bg-purple-100" trend={liveRedemptions && liveRedemptions.length > 0 ? "● LIVE" : "+12%"} />
        <SCard label="Weeks with data" value={String(liveWeekly?.length || 7)} sub={liveWeekly && liveWeekly.length > 0 ? "Weekly points filled" : "Demo default 7"} icon={<BarChart3 className="w-5 h-5 text-blue-600" />} color="bg-blue-100" trend={liveWeekly && liveWeekly.length > 0 ? "DB" : "DEMO"} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-sm text-foreground">Monthly Collection & Redemption</h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${liveMonthly && liveMonthly.length > 0 ? BADGE_SUCCESS_CLS : BADGE_WARN_CLS}`}>{liveMonthly && liveMonthly.length > 0 ? "● LIVE" : "DEMO"}</span>
                <button type="button" onClick={exportAnalyticsCSV} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"><Download className="w-3 h-3" />CSV</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mergedMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="collected" name="Collected (kg)" fill="#16a34a" radius={[4,4,0,0]} />
              <Bar dataKey="redeemed" name="Redeemed" fill="#0ea5e9" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-border">
          <h3 className="font-black text-sm text-foreground mb-4">User / Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mergedMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
              <Line type="monotone" dataKey="users" name="Active Users" stroke="#0ea5e9" strokeWidth={2.5} dot={{ fill: "#0ea5e9", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 border border-border">
        <h3 className="font-black text-sm text-foreground mb-4">Top Redeemed Rewards</h3>
        <div className="space-y-3">
          {rewards.slice(0,5).map((r,i) => {
            const counts = [72,58,41,31,24];
            return (
              <div key={r.id} className="flex items-center gap-3">
                <span className="text-xl w-8">{r.icon}</span>
                <span className="text-xs font-semibold text-foreground w-40 truncate">{r.name}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(counts[i]/counts[0])*100}%` }} />
                </div>
                <span className="text-xs font-black text-muted-foreground w-16 text-right">{counts[i]} redeemed</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getKioskBg(status: string): string {
  if (status === "online") return "bg-green-100";
  if (status === "maintenance") return "bg-amber-100";
  return "bg-red-100";
}

function getKioskIconColor(status: string): string {
  if (status === "online") return "text-green-600";
  if (status === "maintenance") return "text-amber-600";
  return "text-red-500";
}

function getKioskBadgeClass(status: string): string {
  if (status === "online") return BADGE_SUCCESS_CLS;
  if (status === "maintenance") return BADGE_WARN_CLS;
  return "bg-red-100 text-red-600";
}

function getBatteryBg(battery: number): string {
  if (battery > 50) return "bg-green-500";
  if (battery > 20) return "bg-amber-500";
  return "bg-red-500";
}

function getLogLevelBadgeClass(level: string): string {
  if (level === "error") return "bg-red-100 text-red-700";
  if (level === "warn") return BADGE_WARN_CLS;
  return "bg-blue-100 text-blue-700";
}

function AdminMonitoring({ liveKiosks, liveTx, onRefresh }: { liveKiosks: any[] | null; liveTx: any[] | null; onRefresh?: () => Promise<void> }) {
  const [openLogsKiosk, setOpenLogsKiosk] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsMsg, setLogsMsg] = useState<string>("");
  const [calibratingId, setCalibratingId] = useState<string | null>(null);
  const [calibrateMsg, setCalibrateMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const openLogs = async (k: any) => {
    setOpenLogsKiosk(k.id);
    setLogsMsg("");
    setLogs([]);
    try {
      setLogsLoading(true);
      const res = await Waste2GoodsAPI.getKioskLogs(k.kioskId || k.id);
      if (res && Array.isArray((res as any).logs)) setLogs((res as any).logs);
      else setLogsMsg("No logs returned from server (demo or backend offline).");
    } catch (e) {
      setLogsMsg(e instanceof Error ? e.message : "Failed to load logs. Is backend :3001 + MySQL running?");
    } finally { setLogsLoading(false); }
  };

  const doCalibrate = async (k: any) => {
    const id = String(k.kioskId || k.id);
    setCalibratingId(id);
    setCalibrateMsg(null);
    try {
      const res = await Waste2GoodsAPI.calibrateKiosk(id);
      if (res && (res as any).ok) {
        setCalibrateMsg({ id, text: `✓ ${(res as any).message || `Calibration dispatched to ${id}. lastPing set to 'just now'.`}`, ok: true });
        if (onRefresh) await onRefresh();
      } else throw new Error("API didn't return ok");
    } catch (e) {
      setCalibrateMsg({ id, text: e instanceof Error ? e.message : "Calibration failed. Run backend + MySQL.", ok: false });
    } finally {
      setCalibratingId(null);
      setTimeout(() => setCalibrateMsg(cur => (cur && cur.id === id ? null : cur)), 3500);
    }
  };

  const mergedKiosks: any[] = liveKiosks && liveKiosks.length > 0
    ? liveKiosks.map((k, i) => ({
        id: k.kioskId || k.id || `K-0${i + 1}`,
        kioskId: k.kioskId || k.id || `K-0${i + 1}`,
        location: k.locationName || k.location || "Cabantian",
        status: k.status || (k.isOnline ? "online" : "offline"),
        weight: `${Number(k.weightKg || k.lastWeight || 0).toFixed(1)} kg`,
        submissions: Number(k.todaySubmissions || k.submissionsToday || k.totalSubmissions || 0),
        temp: k.temperature ? `${k.temperature}°C` : k.temp || "29°C",
        lastPing: k.lastPing || (k.lastHeartbeatAt ? new Date(String(k.lastHeartbeatAt)).toLocaleTimeString() : "5 min ago"),
        battery: Number(k.batteryPct || k.battery || 85),
      }))
    : kiosks.slice();
  const online = mergedKiosks.filter(k => String(k.status).toLowerCase() === "online").length;
  const offline = mergedKiosks.filter(k => String(k.status).toLowerCase() === "offline").length;
  const maintenance = mergedKiosks.filter(k => String(k.status).toLowerCase() === "maintenance").length;
  const totalSubmissions = mergedKiosks.reduce((a, k) => a + Number(k.submissions || 0), 0) || (liveTx ? liveTx.length : 38);
  return (
    <div className="space-y-4 relative">
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Kiosks", value: String(mergedKiosks.length), sub: liveKiosks && liveKiosks.length > 0 ? "Real from DB" : "Demo default 5", color: "text-foreground", bg: "bg-muted" },
          { label: "Online", value: String(online), sub: `of ${mergedKiosks.length} kiosks`, color: "text-green-700", bg: "bg-green-100" },
          { label: "Offline", value: String(offline), sub: offline > 0 ? "Requires attention" : "All good", color: "text-red-600", bg: "bg-red-100" },
          { label: "Maintenance", value: String(maintenance), sub: maintenance > 0 ? "Scheduled checks" : "None", color: "text-amber-700", bg: "bg-amber-100" },
          { label: "Submissions Today", value: String(totalSubmissions), sub: liveTx ? "From transactions table" : "Demo default", color: "text-blue-700", bg: "bg-blue-100" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground font-semibold mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground font-semibold">{mergedKiosks.length} kiosks <span className={`text-[10px] ml-1 px-2 py-0.5 rounded-full font-bold ${liveKiosks && liveKiosks.length > 0 ? BADGE_SUCCESS_CLS : BADGE_WARN_CLS}`}>{liveKiosks && liveKiosks.length > 0 ? "● LIVE from /api/kiosks" : "DEMO"}</span></p>
          {calibrateMsg && (
            <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${calibrateMsg.ok ? BADGE_SUCCESS_CLS : "bg-red-100 text-red-600"}`}>{calibrateMsg.text}</p>
          )}
        </div>
        {onRefresh && <button type="button" onClick={() => onRefresh()} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"><RefreshCw className="w-3 h-3" />Refresh all</button>}
      </div>

      <div className="space-y-3">
        {mergedKiosks.map(k => (
          <div key={k.id} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${getKioskBg(k.status)}`}>
              <Cpu className={`w-5 h-5 ${getKioskIconColor(k.status)}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-black text-sm text-foreground">{k.id}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize flex items-center gap-1 ${getKioskBadgeClass(k.status)}`}>
                  <StatusPip status={k.status} />{k.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{k.location}</p>
            </div>
            <div className="grid grid-cols-4 gap-6 text-center flex-shrink-0">
              {[["Weight",k.weight],["Submissions",String(k.submissions)],["Temp",k.temp],["Last Ping",k.lastPing]].map(([l,v]) => (
                <div key={String(l)}><p className="text-xs text-muted-foreground">{l}</p><p className="font-black text-xs text-foreground mt-0.5">{v}</p></div>
              ))}
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <Battery className="w-3.5 h-3.5 text-muted-foreground" />
                <div className="w-16 h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${getBatteryBg(k.battery)}`} style={{ width: `${k.battery}%` }} /></div>
                <span className="text-xs font-bold text-muted-foreground">{k.battery}%</span>
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => openLogs(k)} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 disabled:opacity-50"><Eye className="w-3 h-3" />Logs</button>
                <span className="text-muted-foreground">·</span>
                <button type="button" disabled={calibratingId === k.id} onClick={() => doCalibrate(k)} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 disabled:opacity-50">
                  <RefreshCw className={`w-3 h-3 ${calibratingId === k.id ? "animate-spin" : ""}`} />{calibratingId === k.id ? "Calibrating..." : "Calibrate"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Kiosk Logs Modal */}
      {openLogsKiosk && (
        <div className="absolute inset-0 bg-black/50 flex items-start justify-center pt-8 z-50 rounded-2xl">
          <div className="bg-white rounded-2xl p-5 w-[640px] max-w-[95%] shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-black text-foreground flex items-center gap-2"><Cpu className="w-4 h-4 text-primary" />{openLogsKiosk} · Activity Logs</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{logsLoading ? "Loading from MySQL /api/kiosks/:id/logs..." : `${logs.length} entries loaded`}</p>
              </div>
              <button type="button" onClick={() => setOpenLogsKiosk(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            {logsMsg && <div className="mb-2 text-xs px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-semibold">{logsMsg}</div>}
            <div className="max-h-80 overflow-auto border border-border rounded-xl divide-y divide-border bg-background">
              {logsLoading && (
                <div className="px-4 py-10 text-center text-xs text-muted-foreground">Loading logs...</div>
              )}
              {!logsLoading && logs.length === 0 && !logsMsg && (
                <div className="px-4 py-10 text-center text-xs text-muted-foreground">No logs.</div>
              )}
              {!logsLoading && logs.map((l: any, i: number) => (
                <div key={l.id || l.logId || `log-${i}`} className="px-4 py-2 flex items-start gap-2">
                  <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${getLogLevelBadgeClass(l.level)}`}>{l.level || 'info'}</span>
                  <span className="text-[10px] text-muted-foreground w-32 flex-shrink-0">{new Date(l.time || Date.now()).toLocaleString()}</span>
                  <span className="text-xs font-semibold text-foreground flex-1 min-w-0 break-words">{l.message || l.msg || String(l)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={() => setOpenLogsKiosk(null)} className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-green-700 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminAdmins() {
  const [showForm, setShowForm] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const rows = await Waste2GoodsAPI.fetchAdminAdmins();
      setAdmins(Array.isArray(rows) ? rows : []);
    } catch {
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setFirstName(""); setLastName(""); setEmail("");
    setPassword(""); setConfirmPassword(""); setErr(""); setSuccess("");
  };

  const submitForm = async () => {
    setErr(""); setSuccess("");
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setErr("Please fill in all required fields"); return;
    }
    if (password.length < 6) { setErr("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setErr("Passwords do not match"); return; }
    try {
      setCreating(true);
      await Waste2GoodsAPI.createAdmin({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password });
      setSuccess(`Admin ${firstName} ${lastName} created successfully!`);
      resetForm(); setShowForm(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create admin");
    } finally { setCreating(false); }
  };

  const handleDeleteAdmin = async (admin: any) => {
    const id = admin.adminId || admin.email;
    const name = admin.name || `${admin.firstName || ""} ${admin.lastName || ""}`.trim() || id;
    if (admin.adminId === "A-001" || admin.email === "admin@waste2goods.ph") {
      alert("Primary super administrator A-001 cannot be deleted.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete administrator "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setErr(""); setSuccess("");
      setDeletingId(id);
      const res = await (Waste2GoodsAPI as any).deleteAdmin(admin.adminId || admin.email);
      if (res && (res as any).error) throw new Error((res as any).error);
      setSuccess(`Admin ${name} deleted successfully!`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete admin account.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-foreground">Admin Management</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage administrators with access to this panel</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm(v => !v); resetForm(); }}
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />{showForm ? "Cancel" : "Add New Admin"}
        </button>
      </div>

      {err && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
          <AlertTriangle className="w-4 h-4" />{err}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-xs font-semibold">
          <Check className="w-4 h-4" />{success}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-black text-foreground">Create New Admin Account</h3>
              <p className="text-xs text-muted-foreground">New admin will be able to sign in and manage the barangay</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="admin-create-first" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">First Name *</label>
              <input
                id="admin-create-first"
                value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="Juan"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label htmlFor="admin-create-last" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Last Name *</label>
              <input
                id="admin-create-last"
                value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Reyes"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="admin-create-email" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="admin-create-email"
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="barangay.assistant@waste2goods.ph"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label htmlFor="admin-create-pass" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="admin-create-pass"
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label htmlFor="admin-create-pass2" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="admin-create-pass2"
                  type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-5 py-3 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              type="button"
              disabled={creating}
              onClick={submitForm}
              className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {creating ? "Creating..." : "Create Admin Account"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-black text-foreground">Registered Admins ({admins.length})</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Barangay-level admins with full dashboard access</p>
          </div>
          <button type="button" onClick={load} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
            <RefreshCw className="w-3 h-3" />Refresh
          </button>
        </div>
        <div className="divide-y divide-border">
          {loading && (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">Loading admins...</div>
          )}
          {!loading && admins.length === 0 && (
            <div className="px-5 py-16 text-center">
              <Shield className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No admins loaded. Click "Add New Admin" to create one.</p>
            </div>
          )}
          {!loading && admins.map(a => {
            const fullName = a.name || `${a.firstName || ""} ${a.lastName || ""}`.trim();
            const initials = fullName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0,2).toUpperCase();
            const date = a.createdAt ? new Date(a.createdAt) : null;
            const joined = date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "—";
            return (
              <div key={a.adminId || a.email} className="px-5 py-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary">
                  {initials || "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-sm text-foreground truncate">{fullName || "Unnamed Admin"}</p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                      {a.roleId === 1 ? "Full" : "Admin"}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE_SUCCESS_CLS}`}>Active</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                    <span><Mail className="w-3 h-3 inline -mt-0.5 mr-1" />{a.email}</span>
                    <span className="opacity-30">•</span>
                    <span>ID: {a.adminId}</span>
                    <span className="opacity-30">•</span>
                    <span>Joined {joined}</span>
                  </p>
                </div>
                {a.adminId !== "A-001" && a.email !== "admin@waste2goods.ph" ? (
                  <button
                    type="button"
                    disabled={deletingId === (a.adminId || a.email)}
                    onClick={() => handleDeleteAdmin(a)}
                    className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                    title="Delete Admin"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-500">Primary Admin</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}