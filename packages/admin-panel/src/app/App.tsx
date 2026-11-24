import { useState, useEffect } from "react";
import {
  BarChart3, Users, TrendingUp, Bell, Search, LogOut, Recycle,
  ArrowLeft, Zap, Award, ShoppingCart, Scale, Shield,
  X, Plus, Download, Eye, Edit, Trash2,
  AlertCircle, Cpu, RefreshCw, Gift, Target,
  Lock, Mail, AlertTriangle, Check, Archive, ArchiveRestore,
  Activity, Upload, ChevronRight
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { SCard, RankIcon, StatusPip } from "./components/SCard";
import { Waste2GoodsAPI, getApiBaseUrl } from "@waste2goods/core";

// Data constants
const weeklyData = [
  { day: "Mon", bottles: 42 }, { day: "Tue", bottles: 67 }, { day: "Wed", bottles: 53 },
  { day: "Thu", bottles: 89 }, { day: "Fri", bottles: 74 }, { day: "Sat", bottles: 112 }, { day: "Sun", bottles: 95 }
];
const monthlyData = [
  { month: "Jan", collected: 820, users: 210, redeemed: 65 },
  { month: "Feb", collected: 940, users: 245, redeemed: 80 },
  { month: "Mar", collected: 1100, users: 290, redeemed: 102 },
  { month: "Apr", collected: 980, users: 275, redeemed: 89 },
  { month: "May", collected: 1340, users: 340, redeemed: 134 },
  { month: "Jun", collected: 1450, users: 380, redeemed: 158 }
];
const leaderboard = [
  { rank: 1, name: "Ana Reyes", barangay: "Cabantian", points: 4820, avatar: "AR" },
  { rank: 2, name: "Carlo Mendoza", barangay: "Cabantian", points: 3950, avatar: "CM" },
  { rank: 3, name: "Maria Santos", barangay: "Cabantian", points: 2840, avatar: "MS" },
  { rank: 4, name: "Jose Dela Cruz", barangay: "Cabantian", points: 2310, avatar: "JD" },
  { rank: 5, name: "Liza Villareal", barangay: "Cabantian", points: 1990, avatar: "LV" },
  { rank: 6, name: "Ben Pascual", barangay: "Cabantian", points: 1640, avatar: "BP" },
];
const demoTasks = [
  { id: 1, title: "Daily Recycling", description: "Submit at least 1 bottle today", reward: 25, goal: 1, unit: "bottles", type: "daily", status: "active" },
  { id: 2, title: "10 Bottles This Week", description: "Submit 10 bottles total this week", reward: 300, goal: 10, unit: "bottles", type: "weekly", status: "active" },
  { id: 3, title: "10 Bottles in a Day", description: "Submit 10+ PET bottles in a single day", reward: 150, goal: 10, unit: "bottles", type: "daily", status: "active" },
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
  { id: "T-0041", date: "Jun 17, 2026", type: "earn", desc: "Resident · 23 bottles · K-01", pts: 115 },
  { id: "T-0039", date: "Jun 15, 2026", type: "redeem", desc: "Eco Water Bottle", pts: -350 },
  { id: "T-0037", date: "Jun 13, 2026", type: "bonus", desc: "Weekly Challenge Complete", pts: 150 },
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
  { id: "K-01", location: "Cabantian Hall", status: "online", submissions: 12, battery: 94, lastPing: "2 min ago", temp: "28°C" },
  { id: "K-02", location: "Cabantian Elementary School", status: "online", submissions: 7, battery: 78, lastPing: "1 min ago", temp: "27°C" },
  { id: "K-03", location: "Cabantian Market", status: "offline", submissions: 0, battery: 0, lastPing: "3 hrs ago", temp: "—" },
  { id: "K-04", location: "Cabantian Covered Court", status: "online", submissions: 19, battery: 61, lastPing: "just now", temp: "30°C" },
  { id: "K-05", location: "Cabantian Gym", status: "maintenance", submissions: 0, battery: 45, lastPing: "45 min ago", temp: "—" },
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
    } catch { }
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
  if (section === "dashboard") return "Search residents or activities...";
  if (section === "users" || section === "users-detail") return "Search residents by name, email, or ID...";
  if (section === "rewards") return "Search rewards by name, category, or stock...";
  if (section === "quests") return "Search quests by name or description...";
  if (section === "analytics") return "Search rewards, redemptions, or trends...";
  if (section === "monitoring") return "Search kiosks by ID, location, or status...";
  if (section === "admins") return "Search admins by name, email, or role...";
  return "Search across admin panel...";
}

function getNotifSeverityBg(severity: string): string {
  if (severity === "success") return "bg-green-100";
  if (severity === "danger") return "bg-red-100";
  return "bg-blue-100";
}

function getNotifIcon(type: string, severity: string) {
  if (type === "redemption") {
    let color = "text-blue-600";
    if (severity === "success") color = "text-green-600";
    else if (severity === "danger") color = "text-red-500";
    return <ShoppingCart className={`w-4 h-4 ${color}`} />;
  }
  if (type === "newUser") {
    return <Users className="w-4 h-4 text-blue-600" />;
  }
  return <Award className="w-4 h-4 text-green-600" />;
}

function computeAdminDisplay(
  adminProfile: any,
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

type AdminSection = "dashboard" | "users" | "users-detail" | "rewards" | "quests" | "analytics" | "monitoring" | "admins";
type AppScreen = "login" | "admin";

type SettledResult<T> = { status: "fulfilled"; value: T } | { status: "rejected"; reason?: any };

const SETTLED_FULFILLED = "fulfilled";

type DashboardSummaryShape = {
  totalBottles: number; activeResidents: number; pointsAwarded: number; redeemed: number;
  txCount: number; newUsers: number; redeemedDelta: number;
};

type AdminDataSetters = {
  setLiveUsers: (v: any[] | null) => void;
  setLiveRewards: (v: any[] | null) => void;
  setLiveTasks: (v: any[] | null) => void;
  setLiveKiosks: (v: any[] | null) => void;
  setLiveTx: (v: any[] | null) => void;
  setLiveWeekly: (v: any[] | null) => void;
  setLiveMonthly: (v: any[] | null) => void;
  setLiveLeaderboard: (v: any[] | null) => void;
  setLiveRedemptions: (v: any[] | null) => void;
  setDashboardSummary: (v: DashboardSummaryShape | null) => void;
  setNotifications: (v: any[] | null) => void;
  setNotifUnread: (n: number) => void;
  setAdminProfile: (v: any) => void;
  setProfileRefreshKey: (updater: (k: number) => number) => void;
};

function applySettledArray<T>(result: SettledResult<T>, setter: (v: T[] | null) => void) {
  if (result.status !== SETTLED_FULFILLED) return;
  setter(Array.isArray(result.value) ? result.value : null);
}

function buildDashboardSummary(raw: any): DashboardSummaryShape | null {
  if (!raw || typeof raw !== "object") return null;
  return {
    totalBottles: Number(raw.totalBottlesCollected || raw.totalBottles || raw.totalCollected || 0),
    activeResidents: Number(raw.activeResidents || raw.totalUsers || 0),
    pointsAwarded: Number(raw.totalPointsAwarded || raw.pointsAwarded || raw.totalPoints || 0),
    redeemed: Number(raw.rewardsRedeemed || raw.redeemed || 0),
    txCount: Number(raw.totalTransactions || raw.txCount || 0),
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
    Waste2GoodsAPI.getTasks(),
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
  const [users, rewards, kiosks, tx, weekly, monthly, leaderboard, redemptions, summary, notifs, tasks, adminProf] = results;
  applySettledArray(users, setters.setLiveUsers);
  applySettledArray(rewards, setters.setLiveRewards);
  applySettledArray(tasks, setters.setLiveTasks);
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

// --- App() useEffect body helpers — extracted to keep CC ≤ 15 ---

function runAdminDataFetchEffect(
  screen: AppScreen,
  dataSetters: AdminDataSetters,
  cancelledRef: { cancelled: boolean },
): void {
  if (screen !== "admin") return;
  (async () => {
    try {
      const results = await fetchAllAdminSettled(false);
      if (cancelledRef.cancelled) return;
      applyAdminDataSet(results, dataSetters, false);
    } catch {
      // fall-through: null state falls back to demo data during render
    }
  })();
}

function runAdminAuthGuardEffect(screen: AppScreen, setScreen: (s: AppScreen) => void): void {
  if (screen === "login") return;
  const auth = Waste2GoodsAPI.getAuthState();
  if (!auth?.isAuthenticated || !auth?.token) {
    console.log("🔐 Auth guard: no valid token — returning to login screen");
    Waste2GoodsAPI.logout();
    setScreen("login");
  }
}

// --- Section render dispatch helper ---

type SectionRenderProps = {
  section: AdminSection;
  selectedUser: any;
  setSelectedUser: (u: any) => void;
  setSection: (s: AdminSection) => void;
  setAdjustType: (v: any) => void;
  setAdjustAmount: (v: string) => void;
  setAdjustMsg: (v: { type: "ok" | "err"; text: string } | null) => void;
  setShowAdjustModal: (v: boolean) => void;
  dashboardSummary: DashboardSummaryShape | null;
  liveWeekly: any[] | null;
  liveLeaderboard: any[] | null;
  liveTx: any[] | null;
  liveUsers: any[] | null;
  searchQuery: string;
  refreshData: () => Promise<void>;
  liveRewards: any[] | null;
  liveTasks: any[] | null;
  liveRedemptions: any[] | null;
  liveMonthly: any[] | null;
  liveKiosks: any[] | null;
  redemptionAction: any;
  setRedemptionAction: (v: any) => void;
  approving: boolean;
  handleApproveRedemption: () => Promise<void>;
};

function renderAdminSectionContent(p: SectionRenderProps): React.ReactNode {
  const sectionComponents: Record<AdminSection, React.ReactNode> = {
    dashboard: (
      <AdminDashboard
        liveSummary={p.dashboardSummary}
        liveWeekly={p.liveWeekly}
        liveLeaderboard={p.liveLeaderboard}
        liveTx={p.liveTx}
        searchQuery={p.searchQuery}
      />
    ),
    users: (
      <AdminUsers
        liveUsers={p.liveUsers}
        searchQuery={p.searchQuery}
        onRefresh={p.refreshData}
        onSelect={u => { p.setSelectedUser(u); p.setSection("users-detail"); }}
        selectedUser={null} // Only show detail when section is 'users-detail'
        onBack={() => p.setSection("users")}
        onAdjust={() => { p.setAdjustType("Add"); p.setAdjustAmount("100"); p.setAdjustMsg(null); p.setShowAdjustModal(true); }}
      />
    ),
    "users-detail": (
      <AdminUsers
        liveUsers={p.liveUsers}
        searchQuery={p.searchQuery}
        onRefresh={p.refreshData}
        onSelect={u => { p.setSelectedUser(u); p.setSection("users-detail"); }}
        selectedUser={p.selectedUser} // Show detail for selected user
        onBack={() => p.setSection("users")}
        onAdjust={() => { p.setAdjustType("Add"); p.setAdjustAmount("100"); p.setAdjustMsg(null); p.setShowAdjustModal(true); }}
      />
    ),
    rewards: (
      <AdminRewards
        liveRewards={p.liveRewards}
        liveRedemptions={p.liveRedemptions}
        searchQuery={p.searchQuery}
        onRefresh={p.refreshData}
        redemptionAction={p.redemptionAction}
        setRedemptionAction={p.setRedemptionAction}
        approving={p.approving}
        handleApproveRedemption={p.handleApproveRedemption}
      />
    ),
    quests: (
      <AdminQuests
        liveTasks={p.liveTasks}
        searchQuery={p.searchQuery}
        onRefresh={p.refreshData}
      />
    ),
    analytics: (
      <AdminAnalytics
        liveWeekly={p.liveWeekly}
        liveMonthly={p.liveMonthly}
        liveRedemptions={p.liveRedemptions}
        searchQuery={p.searchQuery}
      />
    ),
    monitoring: (
      <AdminMonitoring
        liveKiosks={p.liveKiosks}
        liveTx={p.liveTx}
        onRefresh={p.refreshData}
        searchQuery={p.searchQuery}
      />
    ),
    admins: <AdminAdmins searchQuery={p.searchQuery} />,
  };

  return sectionComponents[p.section] || null;
}

// Login Screen Component
function LoginScreen({ onLogin }: Readonly<{ onLogin: () => void }>) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
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
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("login");
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [selectedUser, setSelectedUser] = useState<any>(null);
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
  // Redemption approve/reject action state (shared between notifications drawer and AdminRewards)
  const [redemptionAction, setRedemptionAction] = useState<{ id: string; status: "approved" | "rejected"; userId: string; rewardName: string } | null>(null);
  const [approving, setApproving] = useState(false);
  // ── Live data state (merged with demo fallbacks) ──
  const [liveUsers, setLiveUsers] = useState<Array<any> | null>(null);
  const [liveRewards, setLiveRewards] = useState<Array<any> | null>(null);
  const [liveTasks, setLiveTasks] = useState<Array<any> | null>(null);
  const [liveKiosks, setLiveKiosks] = useState<Array<any> | null>(null);
  const [liveTx, setLiveTx] = useState<Array<any> | null>(null);
  const [liveWeekly, setLiveWeekly] = useState<Array<any> | null>(null);
  const [liveMonthly, setLiveMonthly] = useState<Array<any> | null>(null);
  const [liveRedemptions, setLiveRedemptions] = useState<Array<any> | null>(null);
  const [liveLeaderboard, setLiveLeaderboard] = useState<Array<any> | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<{
    totalBottles: number; activeResidents: number; pointsAwarded: number; redeemed: number;
    txCount: number; newUsers: number; redeemedDelta: number;
  } | null>(null);
  // ── Admin profile state (reactive; refreshed from DB on mount / section change) ──
  const [adminProfile, setAdminProfile] = useState<any>(null);
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
    setLiveUsers, setLiveRewards, setLiveTasks, setLiveKiosks, setLiveTx,
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

  const [confirmNotif, setConfirmNotif] = useState<{ n: any; status: "approved" | "rejected" } | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [handled, setHandled] = useState<Record<string, string>>({});
  const sendRedemptionStatus = async (id: string, status: "approved" | "rejected"): Promise<any> => {
    const token = Waste2GoodsAPI.getAuthState()?.token || "";
    const attempt = async (s: string): Promise<any> => {
      try {
        const r = await fetch(`${getApiBaseUrl()}/redemptions/${encodeURIComponent(id)}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: s, adminId: "A-001" }),
        });
        const data: any = await r.json().catch(() => ({}));
        if (r.ok) return { ...data, ok: data?.ok !== false };
        const reason = r.status === 401 ? "Session expired. Please sign out and sign in again"
          : r.status === 403 ? (data?.error || data?.message || "Forbidden")
            : (data?.error || data?.message || "Request failed");
        return { ok: false, httpStatus: r.status, error: `${reason} (HTTP ${r.status})` };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Network error" };
      }
    };
    const first = await attempt(status);
    if (first.ok || status !== "approved" || first.httpStatus !== 400) return first;
    return attempt("ready");
  };
  const showToast = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const quickRedemption = (n: any, status: "approved" | "rejected") => {
    if (!n.meta?.redemptionId || approving) return;
    setConfirmNotif({ n, status });
  };

  const runQuickRedemption = async () => {
    if (!confirmNotif) return;
    const { n, status } = confirmNotif;
    const id = n.meta?.redemptionId;
    setApproving(true);
    try {
      const res: any = await sendRedemptionStatus(id, status);
      if (!res || res.error || res.ok === false) {
        showToast("err", res?.error || "Could not update this redemption. It may already be processed.");
        setConfirmNotif(null);
        return;
      }
      setHandled(h => ({ ...h, [id]: status === "approved" ? "ready" : "rejected" }));
      setNotifUnread((u: any) => Math.max(0, Number(u || 0) - 1));
      showToast("ok", status === "approved"
        ? `Approved ${n.meta?.rewardName || "redemption"}. Points deducted.`
        : `Rejected ${n.meta?.rewardName || "redemption"}.`);
      setConfirmNotif(null);
      await refreshData();
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : "Approval failed");
      setConfirmNotif(null);
    } finally {
      setApproving(false);
    }
  };

  // live updates: re-check the server every 8 seconds while logged in
  useEffect(() => {
    if (screen === "login") return;
    const t = setInterval(() => { refreshData(); }, 8000);
    return () => clearInterval(t);
  }, [screen]);

  // ── Approve/Reject redemption request ──
  const handleApproveRedemption = async () => {
    if (!redemptionAction) return;
    setApproving(true);
    try {
      // the server stores approved requests as "ready"
      const res: any = await sendRedemptionStatus(redemptionAction.id, redemptionAction.status);
      if (!res || !res.ok) {
        alert(res?.error || "Could not update this redemption. It may already be processed, or the server rejected the request.");
        return;
      }
      setRedemptionAction(null);
      await refreshData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Redemption action failed");
    } finally {
      setApproving(false);
    }
  };

  // Fetch all modules whenever the section changes (and logged into admin)
  useEffect(() => {
    let cancelled = false;
    runAdminDataFetchEffect(screen, dataSetters, { get cancelled() { return cancelled; } });
    return () => { cancelled = true; };
  }, [screen, section, profileRefreshKey]);

  // Clear any persisted auth on mount to force manual login
  useEffect(() => {
    Waste2GoodsAPI.logout();
  }, []);

  // AUTH GUARD: If screen === 'admin' but no real token is stored, force back to login screen.
  // (Prevents leftover stale state or tampering from showing the dashboard without auth.)
  useEffect(() => {
    runAdminAuthGuardEffect(screen, setScreen);
  }, [screen]);

  const handleLogout = () => {
    Waste2GoodsAPI.logout();
    setScreen("login");
  };

  const navItems = [
    { id: "dashboard" as AdminSection, icon: <BarChart3 className="w-4 h-4" />, label: "Dashboard" },
    { id: "users" as AdminSection, icon: <Users className="w-4 h-4" />, label: "User Management" },
    { id: "rewards" as AdminSection, icon: <Gift className="w-4 h-4" />, label: "Reward Management" },
    { id: "quests" as AdminSection, icon: <Target className="w-4 h-4" />, label: "Quest Management" },
    { id: "analytics" as AdminSection, icon: <TrendingUp className="w-4 h-4" />, label: "Reports & Analytics" },
    { id: "admins" as AdminSection, icon: <Shield className="w-4 h-4" />, label: "Admin Management" },
  ];

  // Show login screen if not authenticated
  if (screen === "login") {
    return <LoginScreen onLogin={() => setScreen("admin")} />;
  }

  // Admin profile data (reactive via adminProfile state; falls back to localStorage then defaults)
  const { name: adminName, email: adminEmail, roleLabel, initials } = computeAdminDisplay(adminProfile, ROLE_NAME);

  const sectionContent = renderAdminSectionContent({
    section,
    selectedUser,
    setSelectedUser,
    setSection,
    setAdjustType,
    setAdjustAmount,
    setAdjustMsg,
    setShowAdjustModal,
    dashboardSummary,
    liveWeekly,
    liveLeaderboard,
    liveTx,
    liveUsers,
    searchQuery,
    refreshData,
    liveRewards,
    liveTasks,
    liveRedemptions,
    liveMonthly,
    liveKiosks,
    redemptionAction,
    setRedemptionAction,
    approving,
    handleApproveRedemption,
  });

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
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
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
                  {(notifications ?? []).slice(0, 20).map(n => {
                    const isRedemption = n.type === "redemption";
                    const rid = n.meta?.redemptionId;
                    const effStatus = handled[rid] ?? n.meta?.status;
                    const isPending = isRedemption && effStatus === "pending";
                    const shownMessage = handled[rid]
                      ? String(n.message || "").replace(/status:\s*\w+/i, `status: ${effStatus}`)
                      : n.message;
                    const handleNotifClick = () => {
                      if (isRedemption) {
                        setSection("rewards");
                      }
                    };
                    return (
                      <div
                        key={n.id}
                        role={isRedemption ? "button" : undefined}
                        tabIndex={isRedemption ? 0 : undefined}
                        onClick={handleNotifClick}
                        onKeyDown={(e) => { if (isRedemption && (e.key === "Enter" || e.key === " ")) handleNotifClick(); }}
                        className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors flex items-start gap-2 ${isRedemption ? "cursor-pointer" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotifSeverityBg(n.severity)}`}>
                          {getNotifIcon(n.type, n.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground leading-tight">{n.title || ''}</p>
                          {shownMessage && <p className="text-[11px] text-muted-foreground mt-0.5">{shownMessage}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.time || Date.now()).toLocaleString()}</p>
                          {isPending && (
                            <div className="flex gap-1 mt-2">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); quickRedemption(n, "approved"); }}
                                disabled={approving}
                                className="px-2 py-1 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-60 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); quickRedemption(n, "rejected"); }}
                                disabled={approving}
                                className="px-2 py-1 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-60 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-3 border-t border-border bg-muted/20">
                  <button type="button" onClick={() => refreshData()} className="w-full py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors flex items-center justify-center gap-1">
                    <RefreshCw className="w-3 h-3" />Refresh from DB
                  </button>
                </div>
              </div>
            )}

            {sectionContent}
          </div>
        </div>
      </div>

      {confirmNotif && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className={`px-6 pt-6 pb-4 flex items-center gap-3 ${confirmNotif.status === "approved" ? "bg-green-50" : "bg-red-50"}`}>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${confirmNotif.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {confirmNotif.status === "approved" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-black text-foreground">{confirmNotif.status === "approved" ? "Approve redemption?" : "Reject redemption?"}</h3>
                <p className="text-xs text-muted-foreground">Resident {confirmNotif.n.meta?.userId || ""}</p>
              </div>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="rounded-2xl border border-border p-3">
                <p className="font-black text-sm text-foreground">{confirmNotif.n.meta?.rewardName || "Reward"}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(confirmNotif.n.time || Date.now()).toLocaleString()}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {confirmNotif.status === "approved"
                  ? "Approving deducts the points from the resident's balance and reduces the reward stock."
                  : "Rejecting keeps the resident's points unchanged."}
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button type="button" disabled={approving} onClick={() => setConfirmNotif(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors disabled:opacity-60">
                Cancel
              </button>
              <button type="button" disabled={approving} onClick={runQuickRedemption}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60 ${confirmNotif.status === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
                {approving ? "Processing..." : confirmNotif.status === "approved" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[70] px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 text-white ${toast.type === "ok" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.type === "ok" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{toast.text}
        </div>
      )}

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

function mapSingleTxRow(t: any, i: number) {
  const bottles = Number(t.quantity ?? t.bottles ?? 0);
  const material = t.materialName || t.materialId || "PET Plastic";
  const kiosk = t.kioskId || "K-01";
  const pts = Number(t.pointsEarned || t.points || 0);
  const desc = pts > 0
    ? `${material} · ${bottles} bottles · ${kiosk}`
    : t.desc || "Reward redemption";
  const hasEarnMarker = pts > 0 && t.pointsEarned !== undefined;
  const isEarn = hasEarnMarker || t.type === "earn";
  return {
    id: t.transactionId || t.id || `tx-${i}`,
    date: t.date || t.timestamp || "Today",
    type: isEarn ? "earn" : t.type || "earn",
    desc,
    pts: pts || 0,
  };
}

function formatDashboardTransactions(liveTx: any[] | null) {
  if (!liveTx || liveTx.length === 0) {
    return transactions.slice(0, 5);
  }
  return liveTx.slice(0, 5).map((tx, i) => mapSingleTxRow(tx, i));
}

function DashboardSummaryCards({ liveSummary }: Readonly<{ liveSummary: any }>) {
  const totalCollectedStr = liveSummary ? formatDemoVal(liveSummary.totalBottles, "12,450", "") : "12,450";
  const activeResidentsStr = liveSummary ? formatDemoVal(liveSummary.activeResidents, "847") : "847";
  const pointsAwardedStr = liveSummary ? formatDemoVal(liveSummary.pointsAwarded, "284.5K", "K") : "284.5K";
  const redeemedStr = liveSummary ? formatDemoVal(liveSummary.redeemed, "234") : "234";

  return (
    <div className="grid grid-cols-4 gap-4">
      <SCard label="Bottles Collected" value={totalCollectedStr} sub={liveSummary ? `From ${liveSummary.txCount || 0} total recycling transactions` : "↑ 18% vs May"} icon={<Scale className="w-5 h-5 text-green-600" />} color="bg-green-100" trend={liveSummary && liveSummary.txCount > 0 ? `Tx:${liveSummary.txCount}` : "+18%"} />
      <SCard label="Active Residents" value={activeResidentsStr} sub={liveSummary ? `${liveSummary.newUsers || 0} registered users (DB total)` : "34 new this week"} icon={<Users className="w-5 h-5 text-blue-600" />} color="bg-blue-100" trend={liveSummary && liveSummary.newUsers > 0 ? `Users:${liveSummary.newUsers}` : "+34"} />
      <SCard label="Points Awarded" value={pointsAwardedStr} sub="All time points distributed" icon={<Award className="w-5 h-5 text-amber-600" />} color="bg-amber-100" />
      <SCard label="Rewards Redeemed" value={redeemedStr} sub={liveSummary ? `Total redemptions processed` : "All time total"} icon={<ShoppingCart className="w-5 h-5 text-purple-600" />} color="bg-purple-100" trend={liveSummary && liveSummary.redeemedDelta > 0 ? `Redeemed:${liveSummary.redeemedDelta}` : "+41"} />
    </div>
  );
}

function WeeklyCollectionCard({
  liveWeekly,
  filteredData,
  totalBottles,
}: Readonly<{
  liveWeekly: any[] | null;
  filteredData: any[];
  totalBottles: number;
}>) {
  let chartData = weeklyData;
  if (filteredData && filteredData.length > 0) {
    chartData = filteredData;
  } else if (liveWeekly && liveWeekly.length > 0) {
    chartData = liveWeekly;
  }
  const isLive = Boolean(liveWeekly && liveWeekly.length > 0);

  return (
    <div className="bg-white rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-black text-sm text-foreground">Bottles Collected</h3>
          <p className="text-[11px] text-muted-foreground">
            Last 7 days • <span className="font-bold text-primary">{totalBottles} bottles</span> total
          </p>
        </div>
        {isLive ? <span className={`text-[10px] px-2.5 py-1 rounded-full ${BADGE_SUCCESS_CLS} font-bold`}>● LIVE from DB</span> : <span className={`text-[10px] px-2.5 py-1 rounded-full ${BADGE_WARN_CLS} font-bold`}>DEMO</span>}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData}>
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
          <Area type="monotone" dataKey="bottles" stroke="#16a34a" strokeWidth={2.5} fill="url(#wg)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopResidentsCard({ liveLeaderboard, searchQuery = "" }: Readonly<{ liveLeaderboard: any[] | null; searchQuery?: string }>) {
  let mergedLeaderboard = formatDashboardLeaderboard(liveLeaderboard);
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    mergedLeaderboard = mergedLeaderboard.filter(u =>
      u.name.toLowerCase().includes(q) || u.avatar.toLowerCase().includes(q)
    );
  }
  const isLive = Boolean(liveLeaderboard && liveLeaderboard.length > 0);

  return (
    <div className="bg-white rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-sm text-foreground">Top Residents</h3>
        {isLive ? <span className={`text-[10px] px-2.5 py-1 rounded-full ${BADGE_SUCCESS_CLS} font-bold`}>● LIVE</span> : <span className={`text-[10px] px-2.5 py-1 rounded-full ${BADGE_WARN_CLS} font-bold`}>DEMO</span>}
      </div>
      <div className="space-y-2">
        {mergedLeaderboard.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No residents match "{searchQuery}".</p>
        )}
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

function RecentActivityCard({ liveTx, searchQuery = "" }: Readonly<{ liveTx: any[] | null; searchQuery?: string }>) {
  let mergedTx = formatDashboardTransactions(liveTx);
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    mergedTx = mergedTx.filter(t =>
      t.desc.toLowerCase().includes(q) || String(t.date).toLowerCase().includes(q)
    );
  }
  const isLive = Boolean(liveTx && liveTx.length > 0);

  return (
    <div className="bg-white rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-sm text-foreground">Recent Activity</h3>
        {isLive ? <span className={`text-[10px] px-2.5 py-1 rounded-full ${BADGE_SUCCESS_CLS} font-bold`}>● LIVE</span> : <span className={`text-[10px] px-2.5 py-1 rounded-full ${BADGE_WARN_CLS} font-bold`}>DEMO</span>}
      </div>
      <div className="space-y-2">
        {mergedTx.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No activities match "{searchQuery}".</p>
        )}
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
  searchQuery = "",
}: Readonly<{
  liveSummary: null | { totalBottles: number; activeResidents: number; pointsAwarded: number; redeemed: number; txCount: number; newUsers: number; redeemedDelta: number; };
  liveWeekly: any[] | null;
  liveLeaderboard: any[] | null;
  liveTx: any[] | null;
  searchQuery?: string;
}>) {
  const weekly = (liveWeekly && liveWeekly.length > 0 ? liveWeekly : weeklyData).map((item: any) => ({ ...item, bottles: Number(item.bottles || 0) }));
  const totalWeeklyBottles = weekly.reduce((acc: number, curr: any) => acc + curr.bottles, 0);

  return (
    <div className="space-y-5">
      <DashboardSummaryCards liveSummary={liveSummary} />

      <WeeklyCollectionCard liveWeekly={liveWeekly} filteredData={weekly} totalBottles={totalWeeklyBottles} />
      <div className="grid grid-cols-2 gap-4">
        <TopResidentsCard liveLeaderboard={liveLeaderboard} searchQuery={searchQuery} />
        <RecentActivityCard liveTx={liveTx} searchQuery={searchQuery} />
      </div>
    </div>
  );
}

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

function normalizeUserStatus(rawStatus: any, points: number, submissions: number): string {
  const fallback = points > 0 || submissions > 0 ? "active" : "inactive";
  const statusBase = String(rawStatus || fallback).toLowerCase();
  return statusBase === "active" || statusBase === "inactive" ? statusBase : "active";
}

function mapSingleLiveUser(u: any, i: number) {
  const firstNamePart = u.firstName || "Resident";
  const lastNamePart = u.lastName || String(i + 1);
  const name = u.name || `${firstNamePart} ${lastNamePart}`.trim();
  const points = Number(u.pointsBalance || u.points || 0);
  const submissions = Number(u.totalSubmissions || u.submissions || 0);
  const redeemed = Number(u.redeemed || 0);
  const rawJoined = u.createdAt || u.joined || u.registrationDate;
  const joined = formatUserJoinedDate(rawJoined);
  const status = normalizeUserStatus(u.status, points, submissions);
  const id = u.userId || u.id || `U-${String(1000 + i).padStart(4, "0")}`;
  const firstSpace = name.indexOf(" ");
  return {
    id,
    userId: id,
    email: u.email || "",
    phone: u.contactInfo || u.phone || "",
    firstName: u.firstName || (firstSpace >= 0 ? name.slice(0, firstSpace) : name) || "",
    lastName: u.lastName || (firstSpace >= 0 ? name.slice(firstSpace + 1) : "") || "",
    name,
    barangay: u.barangayName || u.barangay || "Cabantian",
    points,
    submissions,
    redeemed,
    joined,
    status,
  };
}

function doesUserMatchSearch(u: any, q: string): boolean {
  return (u.name || "").toLowerCase().includes(q) ||
    (u.email || "").toLowerCase().includes(q) ||
    (u.id || "").toLowerCase().includes(q) ||
    (u.userId || "").toLowerCase().includes(q) ||
    (u.barangay || "").toLowerCase().includes(q) ||
    (u.phone || "").toLowerCase().includes(q);
}

function getMergedAndFilteredUsers(liveUsers: any[] | null, searchQuery: string) {
  const mergedUsers: any[] = liveUsers && liveUsers.length > 0
    ? liveUsers.map((u, i) => mapSingleLiveUser(u, i))
    : adminUsers.slice();

  if (!searchQuery?.trim()) return mergedUsers;
  const q = searchQuery.trim().toLowerCase();
  return mergedUsers.filter(u => doesUserMatchSearch(u, q));
}

function mapSingleRewardRow(r: any, i: number) {
  const rid = Number(r.rewardId ?? r.id ?? i + 1);
  const displayName = r.rewardName || r.name || `Reward ${i + 1}`;
  const pts = Number(r.pointsCost || r.points || 0);
  const stock = Number(r.stockQuantity ?? r.stock ?? r.stockCount ?? 0);
  const seasonal = Boolean(r.isSeasonal ?? r.seasonal ?? false);
  return {
    id: rid,
    rewardId: rid,
    icon: r.icon || "🎁",
    rewardName: displayName,
    name: displayName,
    description: r.description || "",
    category: r.category || "Essentials",
    points: pts,
    pointsCost: pts,
    stock,
    stockQuantity: stock,
    seasonal,
    isSeasonal: seasonal,
    status: r.status || "active",
  };
}

function doesRewardMatchSearch(r: any, q: string): boolean {
  return (r.name || "").toLowerCase().includes(q) ||
    (r.category || "").toLowerCase().includes(q) ||
    (r.description || "").toLowerCase().includes(q) ||
    String(r.rewardId || r.id || "").includes(q);
}

function validatePasswordPair(pw: string, pw2: string): string | null {
  if (pw.length < 6) return "Password must be at least 6 characters.";
  if (pw !== pw2) return "Passwords do not match.";
  return null;
}

function buildUserEditPayload(
  first: string, last: string, email: string,
  phone: string, pointsStr: string, pw: string,
) {
  const payload: any = {
    firstName: first.trim(),
    lastName: last.trim(),
    email: email.trim(),
    phone: phone.trim(),
    pointsBalance: Number(pointsStr) || 0,
  };
  if (pw) payload.passwordHash = `hashed_${pw}`;
  return payload;
}

function AdminUserProfileDetail({
  selectedUser,
  banner,
  onBack,
  onAdjust,
  openEdit,
  toggleStatus,
}: Readonly<{
  selectedUser: any;
  banner: { type: "ok" | "err"; text: string } | null;
  onBack: () => void;
  onAdjust: () => void;
  openEdit: (u: any) => void;
  toggleStatus: (u: any) => void;
}>) {
  const profileUid = String(selectedUser.userId || selectedUser.id || "");
  const [userRedemptions, setUserRedemptions] = useState<any[]>([]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res: any = await Waste2GoodsAPI.fetchRedemptions();
      if (!alive || !Array.isArray(res)) return;
      setUserRedemptions(res.filter((r: any) => String(r.userId) === profileUid));
    };
    load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [profileUid]);
  return (
    <div className="flex flex-col gap-4 relative">
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
            {selectedUser.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="font-black text-foreground">{selectedUser.name}</p>
            <p className="text-xs text-muted-foreground">{selectedUser.barangay}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Joined {selectedUser.joined}</p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${selectedUser.status === "active" ? BADGE_SUCCESS_CLS : "bg-gray-100 text-gray-500"}`}>
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
          <button type="button" onClick={() => toggleStatus(selectedUser)} className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${selectedUser.status === "active" ? BADGE_DANGER_CLS + " hover:bg-red-100" : BADGE_OK_CLS + " hover:bg-green-100"}`}>
            {selectedUser.status === "active" ? "🚫 Suspend User" : "✅ Reactivate User"}
          </button>
        </div>
        <div className="col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[["Points Balance", (selectedUser.points ?? selectedUser.pointsBalance ?? 0).toLocaleString() + " pts", "text-primary"], ["Submissions", (selectedUser.submissions ?? 0) + " times", "text-blue-600"], ["Redeemed", (selectedUser.redeemed ?? 0) + " items", "text-purple-600"]].map(([l, v, c]) => (
              <div key={String(l)} className="bg-white rounded-2xl border border-border p-3 text-center">
                <p className={`text-xl font-black ${c}`}>{v}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{l}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-border p-4">
            <h3 className="font-black text-sm mb-3">Recent Transactions</h3>
            <div className="space-y-1.5 mb-3 pb-3 border-b border-border">
              {userRedemptions.length === 0 && <p className="text-xs text-muted-foreground">No redemptions yet.</p>}
              {userRedemptions.map((r: any) => {
                const st = String(r.status || "pending").toLowerCase();
                const label = st === "pending" ? "Pending" : st === "rejected" ? "Rejected" : "Approved";
                const cls = st === "pending" ? "bg-amber-50 text-amber-700 border-amber-200"
                  : st === "rejected" ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-green-50 text-green-700 border-green-200";
                const pts = Number(r.totalPoints || r.pointsUsed || 0).toLocaleString();
                return (
                  <div key={r.redemptionId} className="flex items-center gap-2 py-1 text-xs">
                    <span className="text-muted-foreground">{r.redemptionDate ? new Date(r.redemptionDate).toLocaleDateString() : ""}</span>
                    <span className="flex-1 truncate font-semibold">{r.icon || "🎁"} {r.rewardName || "Reward"}</span>
                    <span className={`font-black ${st === "approved" || st === "ready" ? "text-red-500" : "text-muted-foreground"}`}>{st === "approved" || st === "ready" ? "-" : ""}{pts}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${cls}`}>{label}</span>
                  </div>
                );
              })}
            </div>
            <div className="space-y-1.5">
              {transactions.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center gap-2 py-1 border-b border-border last:border-0 text-xs">
                  <span className="text-muted-foreground">{t.date}</span>
                  <span className="flex-1 truncate font-semibold">{t.desc}</span>
                  <span className={`font-black ${t.pts > 0 ? "text-primary" : "text-red-500"}`}>{t.pts > 0 ? "+" : ""}{t.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminUsers({ liveUsers, searchQuery = "", onRefresh, onSelect, selectedUser, onBack, onAdjust }: Readonly<{ liveUsers: any[] | null; searchQuery?: string; onRefresh?: () => Promise<void>; onSelect: (u: any) => void; selectedUser: any; onBack: () => void; onAdjust: () => void }>) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
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

  const openCreate = () => {
    resetForm();
    setShowEditForm(false);
    setEditUser(null);
    setShowCreateForm(true);
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setShowCreateForm(false);
    setUFirst(u.firstName || "");
    setULast(u.lastName || "");
    setUEmail(u.email || "");
    setUPass("");
    setUPass2("");
    setUPhone(u.phone || u.contactInfo || "");
    setUPoints(String(u.points ?? u.pointsBalance ?? 0));
    setShowEditForm(true);
  };

  const submitCreate = async () => {
    setBanner(null);
    if (!uFirst.trim() || !uLast.trim() || !uEmail.trim() || !uPass.trim()) {
      setBanner({ type: "err", text: "First name, last name, email, and password are required." });
      return;
    }
    const pwError = validatePasswordPair(uPass, uPass2);
    if (pwError) { setBanner({ type: "err", text: pwError }); return; }
    try {
      setSaving(true);
      const res = await Waste2GoodsAPI.createUser({
        firstName: uFirst.trim(),
        lastName: uLast.trim(),
        email: uEmail.trim(),
        password: uPass,
        phone: uPhone.trim(),
        pointsBalance: Number(uPoints) || 0,
        barangayId: 1
      });
      if (!res || !(res as any).ok) throw new Error((res as any)?.error || "User creation failed");
      setBanner({ type: "ok", text: `Resident ${uFirst} ${uLast} created successfully with ${uPoints} pts!` });
      if (onRefresh) await onRefresh();
      setTimeout(() => { setShowCreateForm(false); resetForm(); }, 1500);
    } catch (e) {
      setBanner({ type: "err", text: e instanceof Error ? e.message : "Creation failed. Is backend running with MySQL?" });
    } finally { setSaving(false); }
  };

  const submitEdit = async () => {
    setBanner(null);
    if (!editUser) return;
    if (!uFirst.trim() || !uLast.trim() || !uEmail.trim()) {
      setBanner({ type: "err", text: "First name, last name, and email are required." });
      return;
    }
    const uid = String(editUser.userId || editUser.id);
    const pwError = uPass ? validatePasswordPair(uPass, uPass2) : null;
    if (pwError) { setBanner({ type: "err", text: pwError }); return; }
    const payload = buildUserEditPayload(uFirst, uLast, uEmail, uPhone, uPoints, uPass);
    try {
      setSaving(true);
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
    } catch (e) {
      console.error("Failed to toggle user status:", e);
    }
  };

  const mergedUsers = getMergedAndFilteredUsers(liveUsers, searchQuery);

  const exportCSV = () => {
    const rows = [["User ID", "Name", "Barangay", "Email", "Phone", "Points", "Submissions", "Joined", "Status"]];
    mergedUsers.forEach((u: any) => rows.push([u.userId || u.id, u.name || "", u.barangay || "", u.email || "", u.phone || "", String(u.points || 0), String(u.submissions || 0), u.joined || "", u.status || ""]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `waste2goods-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (selectedUser) {
    return (
      <AdminUserProfileDetail
        selectedUser={selectedUser}
        banner={banner}
        onBack={onBack}
        onAdjust={onAdjust}
        openEdit={openEdit}
        toggleStatus={toggleStatus}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 relative">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-black text-foreground">{mergedUsers.length} registered residents <span className={`text-[10px] ml-1 px-2.5 py-1 rounded-full font-bold ${liveUsers && liveUsers.length > 0 ? BADGE_SUCCESS_CLS : BADGE_WARN_CLS}`}>{liveUsers && liveUsers.length > 0 ? "● LIVE DB" : "DEMO FALLBACK"}</span></p>
          <p className="text-xs text-muted-foreground">Cabantian Barangay — real MySQL users table (users sign up via Mobile App){searchQuery ? ` · filtered for "${searchQuery}"` : ""}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={openCreate} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-green-700 transition-colors shadow-xs"><Plus className="w-3.5 h-3.5" />Add Resident</button>
          {onRefresh && <button type="button" onClick={onRefresh} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold hover:bg-muted transition-colors"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>}
          <button type="button" onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold hover:bg-muted transition-colors"><Download className="w-3.5 h-3.5" />Export</button>
        </div>
      </div>

      {banner && (
        <div className={`text-xs px-4 py-3 rounded-2xl font-semibold flex items-center gap-1.5 ${banner.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {banner.type === 'ok' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{banner.text}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h3 className="font-black text-foreground">Create Resident Account</h3>
              <p className="text-xs text-muted-foreground">Add a new resident with starting balance and login credentials</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="user-create-first" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">First Name *</label>
              <input id="user-create-first" value={uFirst} onChange={e => setUFirst(e.target.value)} placeholder="Juan" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div>
              <label htmlFor="user-create-last" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Last Name *</label>
              <input id="user-create-last" value={uLast} onChange={e => setULast(e.target.value)} placeholder="Reyes" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div className="col-span-2">
              <label htmlFor="user-create-email" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input id="user-create-email" type="email" value={uEmail} onChange={e => setUEmail(e.target.value)} placeholder="resident@example.com" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="user-create-pass" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input id="user-create-pass" type="password" value={uPass} onChange={e => setUPass(e.target.value)} placeholder="Min 6 chars" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="user-create-pass2" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input id="user-create-pass2" type="password" value={uPass2} onChange={e => setUPass2(e.target.value)} placeholder="Confirm password" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="user-create-phone" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Phone</label>
              <input id="user-create-phone" value={uPhone} onChange={e => setUPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div>
              <label htmlFor="user-create-points" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Initial Points Balance</label>
              <input id="user-create-points" type="number" value={uPoints} onChange={e => setUPoints(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowCreateForm(false); resetForm(); }} className="px-5 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
            <button type="button" disabled={saving} onClick={submitCreate} className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">
              {saving ? "Creating..." : "Create Resident"}
            </button>
          </div>
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
              {["Resident", "Barangay", "Points", "Submissions", "Joined", "Status", "Actions"].map(h => (
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
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-black text-white flex-shrink-0">{u.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</div>
                    <div><p className="font-semibold text-foreground">{u.name}</p><p className="text-muted-foreground">{u.id}{u.email ? ` · ${u.email}` : ""}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.barangay}</td>
                <td className="px-4 py-3"><span className="font-black text-primary">{u.points.toLocaleString()}</span></td>
                <td className="px-4 py-3 font-semibold">{u.submissions}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.joined}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold ${u.status === "active" ? BADGE_SUCCESS_CLS : "bg-gray-100 text-gray-500"}`}>
                    <StatusPip status={u.status} />{u.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => onSelect(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => toggleStatus(u)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title={u.status === "active" ? "Suspend" : "Reactivate"}>{u.status === "active" ? <Trash2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}</button>
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

function AdminRewards({ liveRewards, liveRedemptions, searchQuery = "", onRefresh, redemptionAction, setRedemptionAction, approving, handleApproveRedemption }: Readonly<{ liveRewards: any[] | null; liveRedemptions: any[] | null; searchQuery?: string; onRefresh?: () => Promise<void>; redemptionAction: any; setRedemptionAction: (v: any) => void; approving: boolean; handleApproveRedemption: () => Promise<void> }>) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [restock, setRestock] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<any>(null);
  const [rName, setRName] = useState("");
  const [rPoints, setRPoints] = useState<string>("100");
  const [rStock, setRStock] = useState<string>("0");
  const [rDesc, setRDesc] = useState("");
  const [rCat, setRCat] = useState("Eco Essentials");
  const [rIcon, setRIcon] = useState("🎁");
  const [rSeasonal, setRSeasonal] = useState(false);
  const [rRestockQty, setRRestockQty] = useState<string>("50");
  // Pickup desk: staff at the barangay hall hand over a reward by its claim code.
  const [deskCode, setDeskCode] = useState("");
  const [deskBusy, setDeskBusy] = useState(false);
  const [deskMsg, setDeskMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const cleanDeskCode = deskCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const deskMatch = cleanDeskCode.length === 8
    ? (liveRedemptions || []).find((r: any) => String(r.code || r.redeemCode || "").toUpperCase() === cleanDeskCode) || null
    : null;

  const handOver = async (rr: any) => {
    const code = String(rr.code || rr.redeemCode || "");
    if (!code) { setDeskMsg({ type: "err", text: "This request has no claim code." }); return; }
    setDeskMsg(null);
    setDeskBusy(true);
    try {
      if ((rr.status || "pending") === "pending") {
        await Waste2GoodsAPI.approveRedemptionStrict(rr.redemptionId, "approved");
      }
      const res: any = await Waste2GoodsAPI.claimRedemptionCode(code);
      setDeskMsg({ type: "ok", text: `Handed over: ${res.rewardName || rr.rewardName || "Reward"} to ${res.residentName || "resident"}.` });
      setDeskCode("");
      if (onRefresh) await onRefresh();
    } catch (e) {
      setDeskMsg({ type: "err", text: e instanceof Error ? e.message : "Could not hand over this reward." });
      if (onRefresh) await onRefresh();
    } finally { setDeskBusy(false); }
  };

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

  const doRemove = async () => {
    if (!confirmDel) return;
    setBanner(null);
    try {
      const rid = Number(confirmDel.rewardId ?? confirmDel.id ?? 0);
      if (!rid) throw new Error("Missing reward ID");
      const res = await Waste2GoodsAPI.deleteReward(rid);
      if (!res || !(res as any).ok) throw new Error("Remove failed");
      setBanner({ type: "ok", text: `Reward "${confirmDel.rewardName || confirmDel.name || ''}" removed / archived.` });
      if (onRefresh) await onRefresh();
    } catch (e) {
      setBanner({ type: "err", text: e instanceof Error ? e.message : "Remove failed." });
    } finally { setConfirmDel(null); }
  };

  let mergedRewards: any[] = liveRewards && liveRewards.length > 0
    ? liveRewards.map((r, i) => mapSingleRewardRow(r, i))
    : rewards.slice();

  if (searchQuery?.trim()) {
    const q = searchQuery.trim().toLowerCase();
    mergedRewards = mergedRewards.filter(r => doesRewardMatchSearch(r, q));
  }

  const redeemedCounts: Record<string, number> = {};
  (liveRedemptions || []).forEach(rr => {
    const key = String(rr.rewardId || rr.rewardName || "");
    redeemedCounts[key] = (redeemedCounts[key] || 0) + Number(rr.quantity || 1);
  });
  const totalLiveRedemptions = (liveRedemptions || []).length;
  const ICON_CHOICES = ["🥤", "🥢", "👜", "🛍️", "📓", "✏️", "🖊️", "🍚", "🍜", "🐟", "☕", "🧂", "🧺", "🧽", "🧼", "🪥", "🧸", "🌟", "🎨", "🌱", "👕", "🎊", "🎁", "🎄", "🥬", "🧃", "📱", "🪴", "🎟️", "🎒", "🖼️", "🎮"];
  const CAT_CHOICES = ["Eco Essentials", "School Supplies", "Groceries", "Household", "Kids", "Community", "Seasonal", "Other"];

  return (
    <div className="flex flex-col gap-4 relative">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-foreground">{mergedRewards.length} reward items <span className={`text-[10px] ml-1 px-2.5 py-1 rounded-full font-bold ${liveRewards && liveRewards.length > 0 ? BADGE_SUCCESS_CLS : BADGE_WARN_CLS}`}>{liveRewards && liveRewards.length > 0 ? "● LIVE DB" : "DEMO"}</span></p>
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

      <div className="grid grid-cols-4 gap-3 order-last">
        {mergedRewards.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-2 relative">
            <div className="flex items-start justify-between">
              <span className="text-3xl">{r.icon}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => openEdit(r)} className="p-1 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                <button type="button" onClick={() => setConfirmDel(r)} className="p-1 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Remove"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            {r.seasonal && <span className={`absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full ${BADGE_WARN_CLS}`}>Seasonal</span>}
            <div className="mt-1">
              <p className="text-xs font-black text-foreground leading-tight">{r.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.category}{r.description && <span> · {r.description.slice(0, 30)}{r.description.length > 30 ? "…" : ""}</span>}</p>
            </div>
            <div className="flex justify-between text-xs mt-auto">
              <div><p className="text-muted-foreground">Cost</p><p className="font-black text-primary">{r.points} pts</p></div>
              <div className="text-right"><p className="text-muted-foreground">Stock</p><p className={`font-black ${Number(r.stock) < 10 ? "text-red-500" : "text-foreground"}`}>{r.stock}</p></div>
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

      {/* Redemption Requests Management */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-black text-sm text-foreground">Redemption Requests</h3>
            <p className="text-[10px] text-muted-foreground">Review and approve or reject resident redemption requests</p>
          </div>
          <div className="text-xs font-bold text-muted-foreground">
            {(liveRedemptions || []).length} total · {(liveRedemptions || []).filter((r: any) => r.status === "pending").length} pending
          </div>
        </div>

        {/* Pickup desk */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-4 space-y-3">
          <div>
            <p className="text-xs font-black text-foreground uppercase tracking-wide">Pickup desk</p>
            <p className="text-[11px] text-muted-foreground">Resident at the barangay hall? Type the claim code from their My Redemptions screen.</p>
          </div>
          <input
            value={deskCode}
            onChange={e => { setDeskCode(e.target.value.toUpperCase().slice(0, 12)); setDeskMsg(null); }}
            placeholder="ABCD2345"
            aria-label="Claim code"
            className="w-full max-w-xs px-3 py-2.5 rounded-xl border border-border bg-white font-mono font-black text-lg tracking-[0.25em] text-center"
          />
          {deskMsg && (
            <div className={`text-xs px-3 py-2 rounded-xl font-semibold ${deskMsg.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>{deskMsg.text}</div>
          )}
          {cleanDeskCode.length === 8 && !deskMatch && <p className="text-xs font-semibold text-red-600">No redemption found for this code.</p>}
          {deskMatch && (() => {
            const st = String(deskMatch.status || "pending");
            const canHand = st === "pending" || st === "approved" || st === "ready";
            return (
              <div className="rounded-xl bg-white border border-border p-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground">{deskMatch.rewardName || "Reward"} × {deskMatch.quantity || 1}</p>
                  <p className="text-xs text-muted-foreground">{deskMatch.firstName ? `${deskMatch.firstName} ${deskMatch.lastName || ""}` : deskMatch.userId} · {deskMatch.totalPoints || deskMatch.pointsUsed || 0} pts · <span className="font-bold uppercase">{st}</span></p>
                  {!canHand && <p className="text-xs font-semibold text-amber-700 mt-1">{st === "claimed" || st === "completed" ? "Already claimed." : st === "rejected" ? "This request was rejected." : "Not available."}</p>}
                </div>
                {canHand && (
                  <button type="button" disabled={deskBusy} onClick={() => handOver(deskMatch)} className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-green-700 disabled:opacity-60 transition-colors">
                    {deskBusy ? "Working..." : st === "pending" ? "Approve & hand over" : "Hand over"}
                  </button>
                )}
              </div>
            );
          })()}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 text-xs font-bold text-muted-foreground uppercase">Resident</th>
                <th className="pb-2 text-xs font-bold text-muted-foreground uppercase">Reward</th>
                <th className="pb-2 text-xs font-bold text-muted-foreground uppercase">Code</th>
                <th className="pb-2 text-xs font-bold text-muted-foreground uppercase">Points</th>
                <th className="pb-2 text-xs font-bold text-muted-foreground uppercase">Date</th>
                <th className="pb-2 text-xs font-bold text-muted-foreground uppercase">Status</th>
                <th className="pb-2 text-xs font-bold text-muted-foreground uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(liveRedemptions || []).length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-xs text-muted-foreground">No redemption requests yet.</td>
                </tr>
              )}
              {(liveRedemptions || []).map((rr: any) => {
                const status = rr.status || "pending";
                const statusColor = status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : status === "approved" || status === "ready" ? "bg-green-50 text-green-700 border-green-200" : status === "rejected" ? "bg-red-50 text-red-700 border-red-200" : "bg-muted text-muted-foreground";
                const isPending = status === "pending";
                return (
                  <tr key={rr.redemptionId || rr.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <p className="text-xs font-black text-foreground">{rr.firstName && rr.lastName ? `${rr.firstName} ${rr.lastName}` : rr.userId || "Unknown"}</p>
                      <p className="text-[10px] text-muted-foreground">ID: {rr.userId}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-xs font-black text-foreground">{rr.rewardName || rr.rewardId || "Reward"}</p>
                      <p className="text-[10px] text-muted-foreground">#{rr.rewardId}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-xs font-mono font-black text-foreground tracking-wider">{rr.code || rr.redeemCode || "—"}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-xs font-black text-foreground">{rr.totalPoints || rr.pointsUsed || 0} pts</p>
                    </td>
                    <td className="p-3">
                      <p className="text-xs font-black text-foreground">{rr.redemptionDate ? new Date(rr.redemptionDate).toLocaleDateString() : "-"}</p>
                      <p className="text-[10px] text-muted-foreground">{rr.redemptionDate ? new Date(rr.redemptionDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</p>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColor}`}>{status.toUpperCase()}</span>
                    </td>
                    <td className="p-3 text-right">
                      {isPending ? (
                        <div className="flex gap-1 justify-end">
                          <button
                            type="button"
                            disabled={approving}
                            onClick={() => setRedemptionAction({ id: rr.redemptionId, status: "approved", userId: rr.userId, rewardName: rr.rewardName || "Reward" })}
                            className="px-2 py-1.5 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-60 transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button
                            type="button"
                            disabled={approving}
                            onClick={() => setRedemptionAction({ id: rr.redemptionId, status: "rejected", userId: rr.userId, rewardName: rr.rewardName || "Reward" })}
                            className="px-2 py-1.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-60 transition-colors flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      ) : status === "approved" || status === "ready" ? (
                        <button type="button" disabled={deskBusy} onClick={() => handOver(rr)} className="px-2 py-1.5 rounded text-xs font-bold bg-primary text-white hover:bg-green-700 disabled:opacity-60 transition-colors">Hand over</button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-bold">{status === "rejected" ? "Rejected" : status === "claimed" || status === "completed" ? "Claimed" : status}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Redemption Action Confirm Modal */}
      {redemptionAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-2xl">
          <div className="bg-white rounded-2xl p-5 w-80 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-foreground">{redemptionAction.status === "approved" ? "Approve Request?" : "Reject Request?"}</h3>
              <button type="button" onClick={() => setRedemptionAction(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="flex items-center gap-3 mb-4 bg-muted/30 p-3 rounded-xl">
              <span className="text-3xl">🎁</span>
              <div className="min-w-0">
                <p className="font-black text-sm text-foreground truncate">{redemptionAction.rewardName}</p>
                <p className="text-xs text-muted-foreground">Resident ID: {redemptionAction.userId}</p>
                <p className="text-xs text-muted-foreground">Action: <span className={`font-bold ${redemptionAction.status === "approved" ? "text-green-700" : "text-red-700"}`}>{redemptionAction.status.toUpperCase()}</span></p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {redemptionAction.status === "approved"
                ? "Approving will deduct the points from the resident's balance and decrement the reward stock."
                : "Rejecting will cancel the resident's redemption request. No points will be deducted."}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setRedemptionAction(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
              <button type="button" disabled={approving} onClick={handleApproveRedemption} className={`flex-1 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-60 ${redemptionAction.status === "approved" ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-600 text-white hover:bg-red-700"}`}>{approving ? "Processing..." : redemptionAction.status === "approved" ? "Approve" : "Reject"}</button>
            </div>
          </div>
        </div>
      )}

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
            <label htmlFor="rRestockQtyInput" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Quantity to add</label>
            <input id="rRestockQtyInput" type="number" value={rRestockQty} onChange={e => setRRestockQty(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm mb-4" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setRestock(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
              <button type="button" disabled={saving} onClick={submitRestock} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-60">{saving ? "Saving..." : "Restock"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirm */}
      {confirmDel && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-2xl">
          <div className="bg-white rounded-2xl p-5 w-80 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              <div>
                <h3 className="font-black text-foreground">Remove Reward?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{confirmDel.rewardName || confirmDel.name || ''}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Existing redemptions are preserved. This reward will be removed or archived from resident catalog.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
              <button type="button" onClick={doRemove} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function exportAnalyticsDataCSV(mergedMonthly: any[], mergedWeekly: any[], liveRedemptions: any[] | null) {
  const rows = [["Dataset", "Key", "Bottles Collected", "Redeemed", "Active Users", "Notes"]];
  mergedMonthly.forEach((m: any) => rows.push(["Monthly", m.month || m.label || "", String(m.collected || m.bottles || 0), String(m.redeemed || 0), String(m.users || 0), m.note || ""]));
  mergedWeekly.forEach((w: any, i: number) => rows.push(["Weekly", w.week || w.label || `Week ${i + 1}`, String(w.bottles || w.collected || 0), String(w.redeemed || 0), String(w.users || 0), w.note || ""]));
  (liveRedemptions || []).slice(0, 50).forEach((r: any) => rows.push(["Redemption", r.redemptionId || r.id || "", String(r.totalPoints || 0), String(r.quantity || 1), String(r.userId || ""), r.rewardName || r.status || ""]));
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `waste2goods-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function AnalyticsTopRedeemedCard({ searchQuery = "" }: Readonly<{ searchQuery?: string }>) {
  const counts = [72, 58, 41, 31, 24];
  let items = rewards.slice(0, 5).map((r, i) => ({ ...r, count: counts[i] }));
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    items = items.filter(r => r.name.toLowerCase().includes(q) || (r.category?.toLowerCase().includes(q)));
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-sm text-foreground">Top Redeemed Rewards</h3>
        {searchQuery.trim() && <span className="text-xs text-muted-foreground font-semibold">Filter: "{searchQuery}"</span>}
      </div>
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No rewards match "{searchQuery}".</p>
        )}
        {items.map((r) => (
          <div key={r.id} className="flex items-center gap-3">
            <span className="text-xl w-8">{r.icon}</span>
            <span className="text-xs font-semibold text-foreground w-40 truncate">{r.name}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(r.count / counts[0]) * 100}%` }} />
            </div>
            <span className="text-xs font-black text-muted-foreground w-16 text-right">{r.count} redeemed</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getTaskFrequencyBadgeClass(type: string): string {
  if (type === "daily") return "bg-blue-100 text-blue-700";
  if (type === "weekly") return "bg-purple-100 text-purple-700";
  return "bg-amber-100 text-amber-700";
}

function getQuestSubmitButtonText(saving: boolean, isEditing: boolean): string {
  if (saving) return "Saving...";
  return isEditing ? "Save Changes" : "Create Quest";
}

function AdminQuests({ liveTasks, searchQuery = "", onRefresh }: Readonly<{ liveTasks: any[] | null; searchQuery?: string; onRefresh?: () => Promise<void> }>) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<any>(null);
  const [qName, setQName] = useState("");
  const [qPoints, setQPoints] = useState<string>("100");
  const [qTarget, setQTarget] = useState<string>("10");
  const [qFrequency, setQFrequency] = useState("weekly");
  const [qDesc, setQDesc] = useState("");

  const resetForm = () => {
    setQName(""); setQPoints("100"); setQTarget("10"); setQFrequency("weekly"); setQDesc("");
  };

  const openCreate = () => { resetForm(); setEditing(null); setBanner(null); setShowForm(true); };
  const openEdit = (t: any) => {
    setEditing(t);
    setQName(t.title || "");
    setQPoints(String(t.reward ?? 0));
    setQTarget(String(t.goal ?? 1));
    setQFrequency(t.type || "weekly");
    setQDesc(t.description || "");
    setBanner(null); setShowForm(true);
  };

  const submitForm = async () => {
    setBanner(null);
    if (!qName.trim() || Number(qPoints) < 0 || Number(qTarget) <= 0) {
      setBanner({ type: "err", text: "Quest name, a valid bonus, and a target (bottles) above 0 are required." });
      return;
    }
    const payload: any = {
      taskName: qName.trim(),
      description: qDesc.trim(),
      bonusPoints: Number(qPoints) || 0,
      target: Number(qTarget) || 1,
      frequency: qFrequency,
      status: "active",
    };
    try {
      setSaving(true);
      let res: any;
      if (editing) {
        res = await Waste2GoodsAPI.updateTask(editing.id, payload);
      } else {
        res = await Waste2GoodsAPI.createTask(payload);
      }
      if (!res || !(res as any).ok) throw new Error((res as any)?.error || "Quest save failed");
      setBanner({ type: "ok", text: editing ? `Quest "${qName}" updated successfully!` : `Quest "${qName}" created!` });
      if (onRefresh) await onRefresh();
      setTimeout(() => { setShowForm(false); setEditing(null); resetForm(); }, 1500);
    } catch (e) {
      setBanner({ type: "err", text: e instanceof Error ? e.message : "Save failed. Run backend with MySQL." });
    } finally { setSaving(false); }
  };

  const doRemove = async () => {
    if (!confirmDel) return;
    setBanner(null);
    try {
      const res = await Waste2GoodsAPI.deleteTask(confirmDel.id);
      if (!res || !(res as any).ok) throw new Error("Remove failed");
      setBanner({ type: "ok", text: `Quest "${confirmDel.title || ''}" removed / archived.` });
      if (onRefresh) await onRefresh();
    } catch (e) {
      setBanner({ type: "err", text: e instanceof Error ? e.message : "Remove failed." });
    } finally { setConfirmDel(null); }
  };

  let mergedTasks: any[] = liveTasks && liveTasks.length > 0 ? liveTasks.slice() : demoTasks.slice();
  if (searchQuery?.trim()) {
    const q = searchQuery.trim().toLowerCase();
    mergedTasks = mergedTasks.filter(t => String(t.title || "").toLowerCase().includes(q) || String(t.description || "").toLowerCase().includes(q));
  }

  return (
    <div className="flex flex-col gap-4 relative">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-foreground">{mergedTasks.length} quests <span className={`text-[10px] ml-1 px-2.5 py-1 rounded-full font-bold ${liveTasks && liveTasks.length > 0 ? BADGE_SUCCESS_CLS : BADGE_WARN_CLS}`}>{liveTasks && liveTasks.length > 0 ? "● LIVE DB" : "DEMO"}</span></p>
          <p className="text-xs text-muted-foreground">Self-contained recycling quests — no social/manual types{searchQuery ? ` · filter "${searchQuery}"` : ""}</p>
        </div>
        <div className="flex gap-2">
          {onRefresh && <button type="button" onClick={() => onRefresh()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold hover:bg-muted transition-colors"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>}
          <button type="button" onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-green-700 transition-colors"><Plus className="w-3.5 h-3.5" />Add Quest</button>
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
            <div>
              <h3 className="font-black text-foreground">{editing ? "Edit Quest" : "Add New Quest"}</h3>
              <p className="text-xs text-muted-foreground">Saved to MySQL `recycling_tasks` table immediately</p>
            </div>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); resetForm(); }} className="text-xs font-bold text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="quest-name" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Quest Name *</label>
              <input id="quest-name" value={qName} onChange={e => setQName(e.target.value)} placeholder="Submit 2kg of bottles" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div>
              <label htmlFor="quest-points" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Bonus Points *</label>
              <input id="quest-points" type="number" value={qPoints} onChange={e => setQPoints(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div>
              <label htmlFor="quest-target" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Target (bottles) *</label>
              <input id="quest-target" type="number" step="1" min="1" value={qTarget} onChange={e => setQTarget(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div className="col-span-2">
              <label htmlFor="quest-desc" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Short Description</label>
              <textarea id="quest-desc" value={qDesc} onChange={e => setQDesc(e.target.value)} rows={2} placeholder="Describe the quest..." className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none" />
            </div>
            <div className="col-span-2">
              <label htmlFor="quest-freq" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Frequency</label>
              <select id="quest-freq" value={qFrequency} onChange={e => setQFrequency(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); resetForm(); }} className="px-5 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
            <button type="button" disabled={saving} onClick={submitForm} className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">
              {getQuestSubmitButtonText(saving, Boolean(editing))}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {mergedTasks.map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-2 relative">
            <div className="flex items-start justify-between">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${getTaskFrequencyBadgeClass(t.type)}`}>{t.type}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => openEdit(t)} className="p-1 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                <button type="button" onClick={() => setConfirmDel(t)} className="p-1 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Remove"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="mt-1">
              <p className="text-sm font-black text-foreground leading-tight">{t.title}</p>
              {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
            </div>
            <div className="flex justify-between text-xs mt-auto pt-2">
              <div><p className="text-muted-foreground">Target</p><p className="font-black text-foreground">{t.goal} {t.unit || "bottles"}</p></div>
              <div className="text-right"><p className="text-muted-foreground">Bonus</p><p className="font-black text-primary">{t.reward} pts</p></div>
            </div>
          </div>
        ))}
        {mergedTasks.length === 0 && (
          <div className="col-span-3 bg-white rounded-2xl border border-border p-10 text-center text-xs text-muted-foreground">
            <Target className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
            {searchQuery ? `No quests match "${searchQuery}".` : "No quests. Click Add Quest to create one."}
          </div>
        )}
      </div>

      {confirmDel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <h3 className="font-black text-foreground mb-2">Remove Quest?</h3>
            <p className="text-sm text-muted-foreground mb-5">This will remove <strong>{confirmDel.title}</strong>. Residents in progress on it will no longer see it.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">Cancel</button>
              <button type="button" onClick={doRemove} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminAnalytics({ liveWeekly, liveMonthly, liveRedemptions, searchQuery = "" }: Readonly<{ liveWeekly: any[] | null; liveMonthly: any[] | null; liveRedemptions: any[] | null; searchQuery?: string }>) {
  const mergedWeekly = liveWeekly && liveWeekly.length > 0 ? liveWeekly : weeklyData;
  const mergedMonthly = liveMonthly && liveMonthly.length > 0 ? liveMonthly : monthlyData;
  const redeemed = (liveRedemptions || []).length;
  const isLiveMonthly = Boolean(liveMonthly && liveMonthly.length > 0);
  const isLiveWeekly = Boolean(liveWeekly && liveWeekly.length > 0);
  const isLiveRedemptions = Boolean(liveRedemptions && liveRedemptions.length > 0);

  const avgBottles = isLiveWeekly
    ? Math.round(liveWeekly!.reduce((a: any, b: any) => a + Number(b.bottles || 0), 0) / Math.max(1, liveWeekly!.length)).toString()
    : "15";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <SCard label="Avg. bottles per day" value={avgBottles} sub="Weekly avg." icon={<Scale className="w-5 h-5 text-green-600" />} color="bg-green-100" trend={isLiveWeekly ? "LIVE" : "+2.1"} />
        <SCard label="Redemptions Total" value={String(redeemed || 234)} sub={isLiveRedemptions ? "Actual from DB" : "Demo value"} icon={<ShoppingCart className="w-5 h-5 text-purple-600" />} color="bg-purple-100" trend={isLiveRedemptions ? "● LIVE" : "+12%"} />
        <SCard label="Weeks with data" value={String(liveWeekly?.length || 7)} sub={isLiveWeekly ? "Weekly points filled" : "Demo default 7"} icon={<BarChart3 className="w-5 h-5 text-blue-600" />} color="bg-blue-100" trend={isLiveWeekly ? "DB" : "DEMO"} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-sm text-foreground">Monthly Collection &amp; Redemption</h3>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${isLiveMonthly ? BADGE_SUCCESS_CLS : BADGE_WARN_CLS}`}>{isLiveMonthly ? "● LIVE" : "DEMO"}</span>
              <button type="button" onClick={() => exportAnalyticsDataCSV(mergedMonthly, mergedWeekly, liveRedemptions)} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"><Download className="w-3 h-3" />CSV</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mergedMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="collected" name="Bottles Collected" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="redeemed" name="Redeemed" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
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
      <AnalyticsTopRedeemedCard searchQuery={searchQuery} />
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
  return BADGE_DANGER_CLS;
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

function AdminMonitoring({ liveKiosks, liveTx, onRefresh, searchQuery = "" }: Readonly<{ liveKiosks: any[] | null; liveTx: any[] | null; onRefresh?: () => Promise<void>; searchQuery?: string }>) {
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
        const msgText = (res as any).message || `Calibration dispatched to ${id}. lastPing set to 'just now'.`;
        setCalibrateMsg({ id, text: `✓ ${msgText}`, ok: true });
        if (onRefresh) await onRefresh();
      } else throw new Error("API didn't return ok");
    } catch (e) {
      setCalibrateMsg({ id, text: e instanceof Error ? e.message : "Calibration failed. Run backend + MySQL.", ok: false });
    } finally {
      setCalibratingId(null);
      setTimeout(() => setCalibrateMsg(cur => (cur?.id === id ? null : cur)), 3500);
    }
  };

  let mergedKiosks: any[] = liveKiosks && liveKiosks.length > 0
    ? liveKiosks.map((k, i) => ({
      id: k.kioskId || k.id || `K-0${i + 1}`,
      kioskId: k.kioskId || k.id || `K-0${i + 1}`,
      location: k.locationName || k.location || "Cabantian",
      status: k.status || (k.isOnline ? "online" : "offline"),
      submissions: Number(k.todaySubmissions || k.submissionsToday || k.totalSubmissions || 0),
      temp: k.temperature ? `${k.temperature}°C` : k.temp || "29°C",
      lastPing: k.lastPing || (k.lastHeartbeatAt ? new Date(String(k.lastHeartbeatAt)).toLocaleTimeString() : "5 min ago"),
      battery: Number(k.batteryPct || k.battery || 85),
    }))
    : kiosks.slice();

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    mergedKiosks = mergedKiosks.filter(k =>
      String(k.id || "").toLowerCase().includes(q) ||
      String(k.location || "").toLowerCase().includes(q) ||
      String(k.status || "").toLowerCase().includes(q)
    );
  }

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
          <p className="text-xs text-muted-foreground font-semibold">{mergedKiosks.length} kiosks <span className={`text-[10px] ml-1 px-2.5 py-1 rounded-full font-bold ${liveKiosks && liveKiosks.length > 0 ? BADGE_SUCCESS_CLS : BADGE_WARN_CLS}`}>{liveKiosks && liveKiosks.length > 0 ? "● LIVE from /api/kiosks" : "DEMO"}</span>{searchQuery ? ` · filter "${searchQuery}"` : ""}</p>
          {calibrateMsg && (
            <p className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${calibrateMsg.ok ? BADGE_SUCCESS_CLS : "bg-red-100 text-red-600"}`}>{calibrateMsg.text}</p>
          )}
        </div>
        {onRefresh && <button type="button" onClick={() => onRefresh()} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"><RefreshCw className="w-3 h-3" />Refresh all</button>}
      </div>

      <div className="space-y-3">
        {mergedKiosks.length === 0 && (
          <div className="bg-white rounded-2xl border border-border p-10 text-center text-xs text-muted-foreground">
            No kiosks match "{searchQuery}".
          </div>
        )}
        {mergedKiosks.map(k => (
          <div key={k.id} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${getKioskBg(k.status)}`}>
              <Cpu className={`w-5 h-5 ${getKioskIconColor(k.status)}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-black text-sm text-foreground">{k.id}</p>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${getKioskBadgeClass(k.status)}`}>{k.status}</span>
                <span className="text-xs text-muted-foreground font-semibold">· {k.location}</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1 font-semibold"><Upload className="w-3.5 h-3.5 text-blue-600" />{k.submissions} items today</span>
                <span className="flex items-center gap-1 font-semibold"><Activity className="w-3.5 h-3.5 text-amber-600" />{k.temp}</span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className="w-12 h-1.5 rounded-full bg-muted overflow-hidden inline-block"><span className={`h-full rounded-full block ${getBatteryBg(k.battery)}`} style={{ width: `${k.battery}%` }} /></span>
                  {k.battery}%
                </span>
                <span>Last ping: {k.lastPing}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={calibratingId === k.id}
                onClick={() => doCalibrate(k)}
                className="px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-1"
                title="Send zero/tare test ping to kiosk"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${calibratingId === k.id ? 'animate-spin text-primary' : ''}`} />
                {calibratingId === k.id ? 'Calibrating...' : 'Calibrate'}
              </button>
              <button
                type="button"
                onClick={() => openLogs(k)}
                className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-green-700 transition-colors flex items-center gap-1"
              >
                <Activity className="w-3.5 h-3.5" />Logs
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Kiosk Logs Modal */}
      {openLogsKiosk && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-border p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-foreground">Diagnostic Logs · Kiosk {openLogsKiosk}</h3>
                <p className="text-xs text-muted-foreground">Recent telemetry events, weights, errors, and system heartbeats</p>
              </div>
              <button type="button" onClick={() => setOpenLogsKiosk(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="flex-1 overflow-auto rounded-xl border border-border bg-slate-900 text-slate-100 p-3 font-mono text-xs divide-y divide-slate-800">
              {logsMsg && <div className="px-4 py-6 text-center text-xs text-amber-300 font-sans">{logsMsg}</div>}
              {logsLoading && <div className="px-4 py-10 text-center text-xs text-muted-foreground">Loading logs...</div>}
              {!logsLoading && logs.length === 0 && !logsMsg && <div className="px-4 py-10 text-center text-xs text-muted-foreground">No logs.</div>}
              {!logsLoading && logs.map((l: any, i: number) => (
                <div key={l.id || l.logId || `log-${i}`} className="px-2 py-1.5 flex items-start gap-2">
                  <span className={`text-[10px] font-bold uppercase px-1 rounded ${getLogLevelBadgeClass(l.level)}`}>{l.level || 'info'}</span>
                  <span className="text-[10px] text-slate-400 w-24 flex-shrink-0">{new Date(l.time || Date.now()).toLocaleTimeString()}</span>
                  <span className="text-xs text-slate-200 flex-1 break-words">{l.message || l.msg || String(l)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setOpenLogsKiosk(null)} className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-green-700 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminAdmins({ searchQuery = "" }: Readonly<{ searchQuery?: string }>) {
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

  const [tabFilter, setTabFilter] = useState<"all" | "active" | "archived">("active");

  const handleToggleArchiveAdmin = async (admin: any, currentStatus: string) => {
    const id = admin.adminId || admin.email;
    const name = admin.name || `${admin.firstName || ""} ${admin.lastName || ""}`.trim() || id;
    if (admin.adminId === "A-001" || admin.email === "admin@waste2goods.ph") {
      alert("Primary super administrator A-001 cannot be archived.");
      return;
    }
    const isArchiving = currentStatus !== "archived";
    const targetStatus = isArchiving ? "archived" : "active";
    const actionText = isArchiving ? "archive" : "restore";
    const confirmMessage = isArchiving
      ? `Are you sure you want to archive administrator "${name}"? The account will be hidden from active lists but safely retained in the database.`
      : `Restore administrator "${name}" to active status?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      setErr(""); setSuccess("");
      setDeletingId(id);
      if (Waste2GoodsAPI.updateAdminStatus) {
        await Waste2GoodsAPI.updateAdminStatus(id, targetStatus);
      } else {
        await (Waste2GoodsAPI as any).deleteAdmin(id);
      }
      setSuccess(`Admin ${name} ${isArchiving ? "archived (preserved in DB)" : "restored"} successfully!`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : `Failed to ${actionText} admin account.`);
    } finally {
      setDeletingId(null);
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const searchFilteredAdmins = q
    ? admins.filter(a => {
      const name = `${a.firstName || ""} ${a.lastName || ""} ${a.name || ""}`.toLowerCase();
      const em = String(a.email || "").toLowerCase();
      const id = String(a.adminId || "").toLowerCase();
      return name.includes(q) || em.includes(q) || id.includes(q);
    })
    : admins;

  const activeAdmins = searchFilteredAdmins.filter(a => (a.status || "active") === "active");
  const archivedAdmins = searchFilteredAdmins.filter(a => (a.status || "active") === "archived");
  let displayedAdmins;
  if (tabFilter === "all") {
    displayedAdmins = searchFilteredAdmins;
  } else if (tabFilter === "active") {
    displayedAdmins = activeAdmins;
  } else {
    displayedAdmins = archivedAdmins;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-foreground">Admin Management</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage and archive administrators with access to this panel (all records preserved)</p>
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

      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-black text-foreground">Admin Accounts ({admins.length})</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Barangay-level admins with dashboard access</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter Tabs */}
            <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setTabFilter("active")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${tabFilter === "active" ? "bg-primary text-white shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
              >
                Active ({activeAdmins.length})
              </button>
              <button
                type="button"
                onClick={() => setTabFilter("archived")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${tabFilter === "archived" ? "bg-amber-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
              >
                Archived / Hidden ({archivedAdmins.length})
              </button>
              <button
                type="button"
                onClick={() => setTabFilter("all")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${tabFilter === "all" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
              >
                All ({admins.length})
              </button>
            </div>

            <button type="button" onClick={load} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline ml-2">
              <RefreshCw className="w-3 h-3" />Refresh
            </button>
          </div>
        </div>
        <div className="divide-y divide-border">
          {loading && (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">Loading admins...</div>
          )}
          {!loading && displayedAdmins.length === 0 && (
            <div className="px-5 py-16 text-center">
              <Shield className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {tabFilter === "archived" ? "No archived admins." : "No admins found in this view."}
              </p>
            </div>
          )}
          {!loading && displayedAdmins.map(a => {
            const fullName = a.name || `${a.firstName || ""} ${a.lastName || ""}`.trim();
            const initials = fullName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const date = a.createdAt ? new Date(a.createdAt) : null;
            const joined = date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "—";
            const isArchived = (a.status || "active") === "archived";

            return (
              <div key={a.adminId || a.email} className={`px-5 py-4 flex items-center gap-4 transition-colors ${isArchived ? "bg-muted/20 opacity-75" : ""}`}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black ${isArchived ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary"}`}>
                  {initials || "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-sm text-foreground truncate">{fullName || "Unnamed Admin"}</p>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                      {a.roleId === 1 ? "Full" : "Admin"}
                    </span>
                    {isArchived ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Archived / Hidden
                      </span>
                    ) : (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${BADGE_SUCCESS_CLS}`}>
                        Active
                      </span>
                    )}
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
                    onClick={() => handleToggleArchiveAdmin(a, a.status || "active")}
                    className={`px-3 py-2 rounded-xl border transition-colors text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 ${isArchived
                      ? "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
                      : "border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-100/70"
                      }`}
                    title={isArchived ? "Restore to Active" : "Archive Admin (Preserve in Database)"}
                  >
                    {isArchived ? (
                      <>
                        <ArchiveRestore className="w-4 h-4 text-green-600" />
                        <span className="hidden sm:inline">Restore</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-4 h-4 text-amber-600" />
                        <span className="hidden sm:inline">Archive / Hide</span>
                      </>
                    )}
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