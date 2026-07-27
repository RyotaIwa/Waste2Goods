import { useState, useEffect } from "react";
import {
  BarChart3, Users, TrendingUp, Bell, Search, LogOut, Recycle,
  ArrowLeft, Zap, Award, ShoppingCart, Scale, Shield,
  X, Plus, Filter, Download, Eye, Edit, Trash2, MoreHorizontal,
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

type AdminSection = "dashboard" | "users" | "users-detail" | "rewards" | "analytics" | "monitoring" | "admins";
type AppScreen = "login" | "admin";

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
    <div className="w-full rounded-2xl overflow-hidden border border-border shadow-xl flex items-center justify-center" style={{ minHeight: 740, background: "linear-gradient(180deg, #052e16 0%, #0c3547 100%)", fontFamily: "'Inter', sans-serif" }}>
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
            <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
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
            <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
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
  const [selectedUser, setSelectedUser] = useState<typeof adminUsers[0] | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

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

  const auth = Waste2GoodsAPI.getAuthState();
  const adminName = auth?.user?.name || "Juan Reyes";
  const initials = adminName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-border shadow-xl" style={{ minHeight: 740, fontFamily: "'Inter', sans-serif" }}>
      <div className="flex h-full" style={{ minHeight: 740 }}>
        {/* Sidebar */}
        <div className="w-60 flex-shrink-0 flex flex-col" style={{ background: "linear-gradient(180deg, #052e16 0%, #0c3547 100%)" }}>
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
              <button key={item.id} onClick={() => setSection(item.id)}
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
                <p className="text-xs text-green-400">Barangay Admin</p>
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
                <input className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 w-44" placeholder="Search..." />
              </div>
              <button className="relative p-2 rounded-xl border border-border hover:bg-muted transition-colors">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
              </button>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-black text-white">{initials}</div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {section === "dashboard" && <AdminDashboard />}
            {(section === "users" || section === "users-detail") && <AdminUsers onSelect={u => { setSelectedUser(u); setSection("users-detail"); }} selectedUser={section === "users-detail" ? selectedUser : null} onBack={() => setSection("users")} onAdjust={() => setShowAdjustModal(true)} />}
            {section === "rewards" && <AdminRewards />}
            {section === "analytics" && <AdminAnalytics />}
            {section === "monitoring" && <AdminMonitoring />}
            {section === "admins" && <AdminAdmins />}
          </div>
        </div>
      </div>

      {/* Point Adjustment Modal */}
      {showAdjustModal && selectedUser && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-2xl">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-foreground">Adjust Points</h3>
              <button onClick={() => setShowAdjustModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Manually adjust points for <strong>{selectedUser.name}</strong></p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Adjustment Type</label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-border text-sm">
                  <option>Add Points</option><option>Deduct Points</option><option>Set Balance</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Amount</label>
                <input type="number" defaultValue="100" className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Reason</label>
                <input defaultValue="Community event participation" className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAdjustModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => setShowAdjustModal(false)} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-green-700 transition-colors">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <SCard label="Total Collected" value="12,450 kg" sub="↑ 18% vs May" icon={<Scale className="w-5 h-5 text-green-600" />} color="bg-green-100" trend="+18%" />
        <SCard label="Active Residents" value="847" sub="34 new this week" icon={<Users className="w-5 h-5 text-blue-600" />} color="bg-blue-100" trend="+34" />
        <SCard label="Points Awarded" value="284.5K" sub="All time total" icon={<Award className="w-5 h-5 text-amber-600" />} color="bg-amber-100" />
        <SCard label="Rewards Redeemed" value="234" sub="This month" icon={<ShoppingCart className="w-5 h-5 text-purple-600" />} color="bg-purple-100" trend="+41" />
      </div>
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-white rounded-2xl p-4 border border-border">
          <h3 className="font-black text-sm text-foreground mb-4">Weekly Collection (kg)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyData}>
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
        <div className="col-span-2 bg-white rounded-2xl p-4 border border-border">
          <h3 className="font-black text-sm text-foreground mb-3">Waste Composition</h3>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={wasteTypes} cx="50%" cy="50%" innerRadius={32} outerRadius={55} dataKey="value" paddingAngle={3}>
                {wasteTypes.map((e, i) => <Cell key={`wt-${i}`} fill={e.color} />)}
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
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-border">
          <h3 className="font-black text-sm text-foreground mb-3">Top Residents</h3>
          <div className="space-y-2">
            {leaderboard.slice(0,5).map(u => (
              <div key={u.rank} className="flex items-center gap-2">
                <RankIcon rank={u.rank} />
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-black text-white flex-shrink-0">{u.avatar}</div>
                <span className="text-xs font-semibold flex-1 truncate">{u.name}</span>
                <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(u.points/5000)*100}%` }} /></div>
                <span className="text-xs font-black text-primary w-16 text-right">{u.points.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-border">
          <h3 className="font-black text-sm text-foreground mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {transactions.slice(0,5).map(t => (
              <div key={t.id} className="flex items-center gap-2 py-1 border-b border-border last:border-0">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${t.type==="earn"?"bg-green-100":t.type==="redeem"?"bg-blue-100":"bg-amber-100"}`}>
                  {t.type==="earn"?<Recycle className="w-3 h-3 text-green-600" />:t.type==="redeem"?<Gift className="w-3 h-3 text-blue-600" />:<Zap className="w-3 h-3 text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0"><p className="text-xs font-semibold truncate">{t.desc}</p><p className="text-xs text-muted-foreground">{t.date}</p></div>
                <span className={`text-xs font-black ${t.pts>0?"text-primary":"text-red-500"}`}>{t.pts>0?"+":""}{t.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminUsers({ onSelect, selectedUser, onBack, onAdjust }: { onSelect: (u: typeof adminUsers[0]) => void; selectedUser: typeof adminUsers[0] | null; onBack: () => void; onAdjust: () => void }) {
  if (selectedUser) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="font-black text-foreground">User Profile</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 bg-white rounded-2xl border border-border p-5 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-xl font-black text-white">
              {selectedUser.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
            </div>
            <div>
              <p className="font-black text-foreground">{selectedUser.name}</p>
              <p className="text-xs text-muted-foreground">{selectedUser.barangay}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Joined {selectedUser.joined}</p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${selectedUser.status==="active"?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>
              <StatusPip status={selectedUser.status} />{selectedUser.status}
            </span>
            <button onClick={onAdjust} className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Adjust Points
            </button>
          </div>
          <div className="col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[["Points Balance", selectedUser.points.toLocaleString()+" pts","text-primary"],["Submissions",selectedUser.submissions+" times","text-blue-600"],["Redeemed",selectedUser.redeemed+" items","text-purple-600"]].map(([l,v,c]) => (
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{adminUsers.length} registered residents</p>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold hover:bg-muted transition-colors"><Filter className="w-3.5 h-3.5" />Filter</button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold hover:bg-muted transition-colors"><Download className="w-3.5 h-3.5" />Export</button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-green-700 transition-colors"><Plus className="w-3.5 h-3.5" />Add User</button>
        </div>
      </div>
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
            {adminUsers.map(u => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => onSelect(u)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-black text-white flex-shrink-0">{u.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                    <div><p className="font-semibold text-foreground">{u.name}</p><p className="text-muted-foreground">{u.id}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.barangay}</td>
                <td className="px-4 py-3"><span className="font-black text-primary">{u.points.toLocaleString()}</span></td>
                <td className="px-4 py-3 font-semibold">{u.submissions}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.joined}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${u.status==="active"?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>
                    <StatusPip status={u.status} />{u.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onSelect(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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

function AdminRewards() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-foreground">{rewards.length} reward items</p>
          <p className="text-xs text-muted-foreground">3 seasonal · {rewards.filter(r=>r.stock<10).length} low stock</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold hover:bg-muted transition-colors"><Filter className="w-3.5 h-3.5" />Filter</button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-green-700 transition-colors"><Plus className="w-3.5 h-3.5" />Add Reward</button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {rewards.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-2 relative">
            <div className="flex items-start justify-between">
              <span className="text-3xl">{r.icon}</span>
              <button className="p-1 rounded-lg hover:bg-muted transition-colors"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            {r.seasonal && <span className="absolute top-3 left-3 text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Seasonal</span>}
            <div className="mt-1">
              <p className="text-xs font-black text-foreground leading-tight">{r.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.category}</p>
            </div>
            <div className="flex justify-between text-xs mt-auto">
              <div><p className="text-muted-foreground">Cost</p><p className="font-black text-primary">{r.points} pts</p></div>
              <div className="text-right"><p className="text-muted-foreground">Stock</p><p className={`font-black ${r.stock<10?"text-red-500":"text-foreground"}`}>{r.stock}</p></div>
            </div>
            {r.stock < 10 && <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 p-1.5 rounded-lg"><AlertCircle className="w-3 h-3" />Low stock</div>}
            <div className="flex gap-1.5 pt-1">
              <button className="flex-1 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors flex items-center justify-center gap-1"><Edit className="w-3 h-3" />Edit</button>
              <button className="flex-1 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-green-700 transition-colors">Restock</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAnalytics() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <SCard label="Avg. kg per user" value="14.7 kg" sub="This month" icon={<Scale className="w-5 h-5 text-green-600" />} color="bg-green-100" trend="+2.1" />
        <SCard label="Participation Rate" value="68.4%" sub="847 / 1,238 residents" icon={<Users className="w-5 h-5 text-blue-600" />} color="bg-blue-100" trend="+4%" />
        <SCard label="Redemption Rate" value="27.6%" sub="234 of 847 users" icon={<ShoppingCart className="w-5 h-5 text-purple-600" />} color="bg-purple-100" trend="+12%" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-sm text-foreground">Monthly Collection & Redemption</h3>
            <button className="text-xs text-primary font-semibold flex items-center gap-1"><Download className="w-3 h-3" />CSV</button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
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
          <h3 className="font-black text-sm text-foreground mb-4">User Growth Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
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

function AdminMonitoring() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Online", value: "3", sub: "of 5 kiosks", color: "text-green-700", bg: "bg-green-100" },
          { label: "Offline", value: "1", sub: "K-03 Cabantian Market", color: "text-red-600", bg: "bg-red-100" },
          { label: "Maintenance", value: "1", sub: "K-05 Cabantian Gym", color: "text-amber-700", bg: "bg-amber-100" },
          { label: "Submissions Today", value: "38", sub: "Across all kiosks", color: "text-blue-700", bg: "bg-blue-100" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground font-semibold mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {kiosks.map(k => (
          <div key={k.id} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${k.status==="online"?"bg-green-100":k.status==="maintenance"?"bg-amber-100":"bg-red-100"}`}>
              <Cpu className={`w-5 h-5 ${k.status==="online"?"text-green-600":k.status==="maintenance"?"text-amber-600":"text-red-500"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-black text-sm text-foreground">{k.id}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize flex items-center gap-1 ${k.status==="online"?"bg-green-100 text-green-700":k.status==="maintenance"?"bg-amber-100 text-amber-700":"bg-red-100 text-red-600"}`}>
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
                <div className="w-16 h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${k.battery>50?"bg-green-500":k.battery>20?"bg-amber-500":"bg-red-500"}`} style={{ width: `${k.battery}%` }} /></div>
                <span className="text-xs font-bold text-muted-foreground">{k.battery}%</span>
              </div>
              <div className="flex gap-1.5">
                <button className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"><Eye className="w-3 h-3" />Logs</button>
                <span className="text-muted-foreground">·</span>
                <button className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"><RefreshCw className="w-3 h-3" />Calibrate</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAdmins() {
  const [showForm, setShowForm] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-foreground">Admin Management</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage administrators with access to this panel</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); resetForm(); }}
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />{showForm ? "Cancel" : "Add New Admin"}
        </button>
      </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">First Name *</label>
              <input
                value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="Juan"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Last Name *</label>
              <input
                value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Reyes"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="barangay.assistant@waste2goods.ph"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); resetForm(); }} className="px-5 py-3 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
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
          <button onClick={load} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
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
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                    <span><Mail className="w-3 h-3 inline -mt-0.5 mr-1" />{a.email}</span>
                    <span className="opacity-30">•</span>
                    <span>ID: {a.adminId}</span>
                    <span className="opacity-30">•</span>
                    <span>Joined {joined}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}