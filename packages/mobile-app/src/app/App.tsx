
import { useState, useEffect, useRef } from "react";
import { Waste2GoodsAPI } from "@waste2goods/core";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  Smartphone, Monitor, Cpu, Recycle, Home, QrCode, Gift,
  Target, User, ArrowLeft, Check, AlertCircle, Scale,
  RefreshCw, MapPin, Activity, ShoppingCart, Filter, MoreHorizontal,
  Plus, Edit, Trash2, Eye, Wifi, Clock, Trophy, Medal, Zap, Award,
  BarChart3, Users, TrendingUp, Bell, Search, LogOut, HelpCircle,
  ChevronRight, Shield, Mail, Phone, BookOpen, Leaf, Star,
  Download, X, Settings, Lock, Info, Flame, Camera, Globe
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

type MobileScreen =
  | "splash" | "onboard1" | "onboard2" | "onboard3"
  | "login" | "register" | "mfa" | "profile-setup"
  | "home" | "submit" | "submit-scan" | "submit-confirm" | "submit-done"
  | "rewards" | "redeem-confirm" | "redeem-history"
  | "tasks" | "profile" | "history" | "settings";

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
  { name: "PET Plastic", value: 38, color: "#16a34a" },
];
const leaderboard = [
  { rank: 1, name: "Ana Reyes", barangay: "Cabantian", points: 4820, avatar: "AR", streak: 14 },
  { rank: 2, name: "Carlo Mendoza", barangay: "Cabantian", points: 3950, avatar: "CM", streak: 9 },
  { rank: 3, name: "Maria Santos", barangay: "Cabantian", points: 2840, avatar: "MS", streak: 7, isMe: true },
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
const tasks = [
  { id: 1, title: "Submit 2kg of PET bottles", reward: 100, progress: 1.4, goal: 2, unit: "kg", type: "daily", done: false },
  { id: 2, title: "Visit kiosk 3 days in a row", reward: 150, progress: 2, goal: 3, unit: "days", type: "weekly", done: false },
  { id: 3, title: "Refer a neighbor", reward: 200, progress: 1, goal: 1, unit: "person", type: "special", done: true },
  { id: 4, title: "Collect 5kg of cardboard", reward: 120, progress: 5, goal: 5, unit: "kg", type: "weekly", done: true },
  { id: 5, title: "Submit any 3 material types", reward: 80, progress: 2, goal: 3, unit: "types", type: "daily", done: false },
];
const transactions = [
  { id: "T-0041", date: "Jun 17, 2026", type: "earn", desc: "PET Plastic · 2.3 kg · K-01", pts: 115 },
  { id: "T-0040", date: "Jun 16, 2026", type: "earn", desc: "Cardboard · 3.1 kg · K-02", pts: 93 },
  { id: "T-0039", date: "Jun 15, 2026", type: "redeem", desc: "Eco Water Bottle", pts: -350 },
  { id: "T-0038", date: "Jun 14, 2026", type: "earn", desc: "Metal Cans · 1.8 kg · K-01", pts: 144 },
  { id: "T-0037", date: "Jun 13, 2026", type: "bonus", desc: "Weekly Challenge Complete", pts: 150 },
  { id: "T-0036", date: "Jun 12, 2026", type: "earn", desc: "Glass Bottles · 2.0 kg · K-04", pts: 50 },
];
const kiosks = [
  { id: "K-01", location: "Cabantian Hall", status: "online", weight: "2.3 kg", submissions: 12, battery: 94, lastPing: "2 min ago", temp: "28°C" },
  { id: "K-02", location: "Cabantian Elementary School", status: "online", weight: "0.8 kg", submissions: 7, battery: 78, lastPing: "1 min ago", temp: "27°C" },
  { id: "K-03", location: "Cabantian Market", status: "offline", weight: "—", submissions: 0, battery: 0, lastPing: "3 hrs ago", temp: "—" },
  { id: "K-04", location: "Cabantian Covered Court", status: "online", weight: "4.1 kg", submissions: 19, battery: 61, lastPing: "just now", temp: "30°C" },
  { id: "K-05", location: "Cabantian Gym", status: "maintenance", weight: "—", submissions: 0, battery: 45, lastPing: "45 min ago", temp: "—" },
];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-slate-400" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-500" />;
  return <span className="text-xs text-muted-foreground font-mono font-bold">#{rank}</span>;
}

function StatusPip({ status }: { status: string }) {
  const c: Record<string, string> = { online: "bg-emerald-400", offline: "bg-red-400", maintenance: "bg-amber-400", active: "bg-emerald-400", inactive: "bg-gray-300" };
  return <span className={`inline-block w-2 h-2 rounded-full ${c[status] ?? "bg-gray-300"}`} />;
}

function SignalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <rect x="0" y="9" width="3" height="7" rx="1" /><rect x="4.5" y="6" width="3" height="10" rx="1" />
      <rect x="9" y="3" width="3" height="13" rx="1" /><rect x="13.5" y="0" width="3" height="16" rx="1" />
    </svg>
  );
}

function useAnimatedWeight(target: number, running: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!running) return;
    const step = target / 40;
    let cur = 0;
    const iv = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(parseFloat(cur.toFixed(2)));
      if (cur >= target) clearInterval(iv);
    }, 60);
    return () => clearInterval(iv);
  }, [running, target]);
  return val;
}

function Field({ label, placeholder, type = "text", icon, value, onChange }: { label: string; placeholder: string; type?: string; icon?: React.ReactNode; value?: string; onChange?: (value: string) => void }) {
  return (
    <div>
      <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40`}
        />
      </div>
    </div>
  );
}

function MobileBottomNav({ screen, go }: { screen: MobileScreen; go: (s: MobileScreen) => void }) {
  const items = [
    { icon: <Home className="w-5 h-5" />, label: "Home", s: "home" as MobileScreen },
    { icon: <QrCode className="w-5 h-5" />, label: "Submit", s: "submit" as MobileScreen },
    { icon: <Gift className="w-5 h-5" />, label: "Rewards", s: "rewards" as MobileScreen },
    { icon: <Target className="w-5 h-5" />, label: "Tasks", s: "tasks" as MobileScreen },
    { icon: <User className="w-5 h-5" />, label: "Profile", s: "profile" as MobileScreen },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-2 pb-2 pt-2 flex justify-around z-20">
      {items.map(i => (
        <button key={i.label} onClick={() => go(i.s)} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${screen === i.s || (i.s === "submit" && ["submit","submit-scan","submit-confirm","submit-done"].includes(screen)) ? "text-primary" : "text-muted-foreground"}`}>
          {i.icon}
          <span className="text-xs font-bold">{i.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<MobileScreen>("splash");
  const [leaderTab, setLeaderTab] = useState<"weekly" | "monthly">("weekly");
  const [regStep, setRegStep] = useState(0);
  const [selectedReward, setSelectedReward] = useState<typeof rewards[0] | null>(null);
  const [rewardFilter, setRewardFilter] = useState("All");
  const [mfaCode, setMfaCode] = useState(["", "", "", "", "", ""]);
  const [weighing, setWeighing] = useState(false);
  const [email, setEmail] = useState("resident@cabantian.ph");
  const [password, setPassword] = useState("ResidentCabantian2025");
  const weight = useAnimatedWeight(2.3, weighing);
  const mfaRefs = useRef<(HTMLInputElement | null)[]>([]);

  const go = (s: MobileScreen) => setScreen(s);

  useEffect(() => {
    if (screen === "splash") {
      const auth = Waste2GoodsAPI.getAuthState();
      if (auth?.isAuthenticated) {
        const t = setTimeout(() => go("home"), 1000);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => go("onboard1"), 1800);
        return () => clearTimeout(t);
      }
    }
  }, [screen]);

  useEffect(() => {
    if (screen === "submit-scan") {
      const t = setTimeout(() => go("submit-confirm"), 2200);
      return () => clearTimeout(t);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === "submit-confirm") {
      setWeighing(false);
      setTimeout(() => setWeighing(true), 300);
    }
  }, [screen]);

  // QR Scanner for mobile
  useEffect(() => {
    if (screen === "submit-scan") {
      // Initialize the scanner
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scanner.render(
        (decodedText) => {
          // On success, proceed to next screen
          console.log("QR code scanned:", decodedText);
          scanner.clear().catch(() => {});
          go("submit-confirm");
        },
        (errorMessage) => {
          console.log("QR scan error:", errorMessage);
        }
      );
      // Cleanup on unmount
      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [screen]);

  const rewardCategories = ["All", "Education", "Grocery", "Lifestyle", "Garden", "Wellness"];
  const filteredRewards = rewardFilter === "All" ? rewards : rewards.filter(r => r.category === rewardFilter);

  return (
    <div className="flex flex-col items-center gap-4 min-h-screen bg-background p-8">
      {/* Phone frame */}
      <div className="relative" style={{ width: 390, height: 820, background: "#0f172a", borderRadius: 52, padding: 12, boxShadow: "0 50px 100px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.07)" }}>
        {/* Side buttons */}
        <div className="absolute -left-1 top-32 w-1 h-10 bg-gray-700 rounded-l-sm" />
        <div className="absolute -left-1 top-48 w-1 h-16 bg-gray-700 rounded-l-sm" />
        <div className="absolute -left-1 top-68 w-1 h-16 bg-gray-700 rounded-l-sm" />
        <div className="absolute -right-1 top-40 w-1 h-20 bg-gray-700 rounded-r-sm" />

        <div className="relative overflow-hidden" style={{ width: "100%", height: "100%", borderRadius: 42, background: "#f0fdf4", fontFamily: "'Nunito', sans-serif" }}>
          {/* Dynamic island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 w-32 h-8 bg-black rounded-full flex items-center justify-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-800" />
            <div className="w-12 h-2.5 rounded-full bg-gray-900" />
          </div>

          {/* Status bar */}
          {!["splash","onboard1","onboard2","onboard3"].includes(screen) && (
            <div className="absolute top-3 left-0 right-0 z-30 px-8 flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground" style={{ fontSize: 11 }}>9:41</span>
              <div className="flex items-center gap-1">
                <SignalIcon className="w-3 h-3 text-muted-foreground" />
                <Wifi className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-bold text-muted-foreground" style={{ fontSize: 10 }}>94%</span>
              </div>
            </div>
          )}

          {/* ── Splash ── */}
          {screen === "splash" && (
            <div className="h-full flex flex-col items-center justify-center" style={{ background: "linear-gradient(160deg, #052e16 0%, #166534 45%, #0c4a6e 100%)" }}>
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center" style={{ boxShadow: "0 0 80px rgba(34,197,94,0.3)" }}>
                  <Recycle className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-400 border-2 border-green-900 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-green-900" />
                </div>
              </div>
              <h1 className="text-4xl font-black text-white mt-6 tracking-tight">Waste2Goods</h1>
              <p className="text-green-300 text-sm mt-1 font-semibold">Recycle · Earn · Thrive</p>
              <div className="mt-12 flex gap-1.5">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: `${i*0.3}s` }} />)}
              </div>
            </div>
          )}

          {/* ── Onboard 1 ── */}
          {screen === "onboard1" && (
            <div className="h-full flex flex-col" style={{ background: "linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)" }}>
              <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 gap-6">
                <div className="w-48 h-48 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center" style={{ boxShadow: "0 20px 60px rgba(22,163,74,0.15)" }}>
                  <div className="text-8xl">♻️</div>
                </div>
                <div className="text-center">
                  <h2 className="text-3xl font-black text-foreground">Recycle for Rewards</h2>
                  <p className="text-muted-foreground text-sm mt-3 leading-relaxed">Bring your plastic bottles, cardboard, and metal cans to any Waste2Goods kiosk and earn points instantly.</p>
                </div>
              </div>
              <div className="px-8 pb-12 space-y-4">
                <div className="flex justify-center gap-2">
                  <div className="w-6 h-2 rounded-full bg-primary" /><div className="w-2 h-2 rounded-full bg-muted" /><div className="w-2 h-2 rounded-full bg-muted" />
                </div>
                <button onClick={() => go("onboard2")} className="w-full py-4 rounded-2xl bg-primary text-white font-black text-base hover:bg-green-700 transition-colors">Next</button>
                <button onClick={() => go("login")} className="w-full text-center text-sm text-muted-foreground font-semibold">Skip</button>
              </div>
            </div>
          )}

          {/* ── Onboard 2 ── */}
          {screen === "onboard2" && (
            <div className="h-full flex flex-col" style={{ background: "linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)" }}>
              <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 gap-6">
                <div className="w-48 h-48 rounded-full bg-blue-100 border-4 border-blue-200 flex items-center justify-center" style={{ boxShadow: "0 20px 60px rgba(14,165,233,0.15)" }}>
                  <div className="text-8xl">🏆</div>
                </div>
                <div className="text-center">
                  <h2 className="text-3xl font-black text-foreground">Climb the Leaderboard</h2>
                  <p className="text-muted-foreground text-sm mt-3 leading-relaxed">Compete with neighbors and earn special recognition. Top recyclers win bonus rewards each week.</p>
                </div>
              </div>
              <div className="px-8 pb-12 space-y-4">
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted" /><div className="w-6 h-2 rounded-full bg-primary" /><div className="w-2 h-2 rounded-full bg-muted" />
                </div>
                <button onClick={() => go("onboard3")} className="w-full py-4 rounded-2xl bg-primary text-white font-black text-base hover:bg-green-700 transition-colors">Next</button>
                <button onClick={() => go("login")} className="w-full text-center text-sm text-muted-foreground font-semibold">Skip</button>
              </div>
            </div>
          )}

          {/* ── Onboard 3 ── */}
          {screen === "onboard3" && (
            <div className="h-full flex flex-col" style={{ background: "linear-gradient(180deg, #fdf4ff 0%, #f3e8ff 100%)" }}>
              <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 gap-6">
                <div className="w-48 h-48 rounded-full bg-purple-100 border-4 border-purple-200 flex items-center justify-center" style={{ boxShadow: "0 20px 60px rgba(139,92,246,0.15)" }}>
                  <div className="text-8xl">🎁</div>
                </div>
                <div className="text-center">
                  <h2 className="text-3xl font-black text-foreground">Redeem Real Rewards</h2>
                  <p className="text-muted-foreground text-sm mt-3 leading-relaxed">Exchange your points for school supplies, groceries, seedlings, and seasonal community prizes.</p>
                </div>
              </div>
              <div className="px-8 pb-12 space-y-4">
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted" /><div className="w-2 h-2 rounded-full bg-muted" /><div className="w-6 h-2 rounded-full bg-primary" />
                </div>
                <button onClick={() => go("register")} className="w-full py-4 rounded-2xl bg-primary text-white font-black text-base hover:bg-green-700 transition-colors">Create Account</button>
                <button onClick={() => go("login")} className="w-full text-center text-sm font-semibold text-muted-foreground">Already have an account? <span className="text-primary">Sign in</span></button>
              </div>
            </div>
          )}

          {/* ── Register ── */}
          {screen === "register" && (
            <div className="h-full flex flex-col overflow-y-auto pt-14">
              <div className="px-6 py-4 flex items-center gap-3 border-b border-border bg-white sticky top-0">
                <button onClick={() => go("onboard3")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
                <div>
                  <h2 className="text-base font-black text-foreground">Create Account</h2>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3].map(s => <div key={s} className={`h-1 rounded-full transition-all ${regStep >= s-1 ? "bg-primary w-8" : "bg-muted w-4"}`} />)}
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1">
                {regStep === 0 && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-3">Step 1 of 3 — Account Info</p>
                      <div className="space-y-3">
                        <Field label="Full Name" placeholder="Maria Santos" icon={<User className="w-4 h-4" />} />
                        <Field label="Email Address" placeholder="maria@email.com" icon={<Mail className="w-4 h-4" />} />
                        <Field label="Password" placeholder="••••••••" type="password" icon={<Lock className="w-4 h-4" />} />
                        <Field label="Confirm Password" placeholder="••••••••" type="password" icon={<Lock className="w-4 h-4" />} />
                      </div>
                    </div>
                    <button onClick={() => setRegStep(1)} className="w-full py-4 rounded-2xl bg-primary text-white font-black">Continue</button>
                  </div>
                )}
                {regStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1">Step 2 of 3 — Community Info</p>
                    <Field label="Phone Number" placeholder="+63 912 345 6789" icon={<Phone className="w-4 h-4" />} />
                    <Field label="Region" placeholder="NCR" icon={<MapPin className="w-4 h-4" />} />
                    <Field label="Province" placeholder="Metro Manila" icon={<MapPin className="w-4 h-4" />} />
                    <Field label="City / Municipality" placeholder="Quezon City" icon={<MapPin className="w-4 h-4" />} />
                    <Field label="Barangay" placeholder="Cabantian" icon={<MapPin className="w-4 h-4" />} />
                    <Field label="Street / House Building" placeholder="123 Sampaguita St." icon={<MapPin className="w-4 h-4" />} />
                    <button onClick={() => setRegStep(2)} className="w-full py-4 rounded-2xl bg-primary text-white font-black">Continue</button>
                    <button onClick={() => setRegStep(0)} className="w-full text-center text-sm text-muted-foreground font-semibold">Back</button>
                  </div>
                )}
                {regStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1">Step 3 of 3 — Security</p>
                    <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex gap-3">
                      <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 font-semibold leading-relaxed">Enable Multi-Factor Authentication to protect your account and points balance from unauthorized access.</p>
                    </div>
                    <div className="space-y-3">
                      {[["SMS One-Time Password", "Text message to your phone", true], ["Authenticator App", "Google/Microsoft Authenticator", false]].map(([t, s, checked]) => (
                        <label key={String(t)} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-white cursor-pointer">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${checked ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                            {checked && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{String(t)}</p>
                            <p className="text-xs text-muted-foreground">{String(s)}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <button onClick={() => { setRegStep(0); go("mfa"); }} className="w-full py-4 rounded-2xl bg-primary text-white font-black">Enable MFA & Continue</button>
                    <button onClick={() => { setRegStep(0); go("profile-setup"); }} className="w-full text-center text-sm text-muted-foreground font-semibold">Skip for now</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MFA ── */}
          {screen === "mfa" && (
            <div className="h-full flex flex-col items-center justify-center px-8 gap-7 pt-14">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-foreground">Verify Your Phone</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">We sent a 6-digit code to <strong>+63 912 *** 6789</strong>. Enter it below.</p>
              </div>
              <div className="flex gap-2">
                {mfaCode.map((d, i) => (
                  <input key={i}
                    ref={el => { mfaRefs.current[i] = el; }}
                    maxLength={1} value={d}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, "");
                      const next = [...mfaCode]; next[i] = v;
                      setMfaCode(next);
                      if (v && i < 5) mfaRefs.current[i + 1]?.focus();
                    }}
                    className="w-11 h-14 rounded-xl border-2 border-border bg-white text-center text-xl font-black focus:outline-none focus:border-primary transition-colors"
                  />
                ))}
              </div>
              <button onClick={() => { setMfaCode(["","","","","",""]); go("profile-setup"); }} className="w-full py-4 rounded-2xl bg-primary text-white font-black">Verify Code</button>
              <p className="text-xs text-muted-foreground text-center">Didn't receive it? <span className="text-primary font-bold cursor-pointer">Resend in 0:48</span></p>
            </div>
          )}

          {/* ── Profile Setup ── */}
          {screen === "profile-setup" && (
            <div className="h-full flex flex-col overflow-y-auto pt-14">
              <div className="px-6 py-4 border-b border-border bg-white sticky top-0">
                <h2 className="text-base font-black text-foreground">Set Up Your Profile</h2>
                <p className="text-xs text-muted-foreground">Almost there!</p>
              </div>
              <div className="p-6 flex-1 space-y-5">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                      <User className="w-10 h-10 text-primary/40" />
                    </div>
                    <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-white">
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">Upload a profile photo (optional)</p>
                </div>
                <Field label="Display Name" placeholder="Maria" icon={<User className="w-4 h-4" />} defaultVal="Maria Santos" />
                <div>
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Bio (optional)</label>
                  <textarea className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" rows={3} placeholder="I recycle because I care about my community..." />
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 flex gap-2">
                  <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 font-semibold">Complete your profile to earn a <strong>50 bonus points</strong> welcome gift!</p>
                </div>
                <button onClick={() => go("home")} className="w-full py-4 rounded-2xl bg-primary text-white font-black">Start Recycling!</button>
              </div>
            </div>
          )}

          {/* ── Login ── */}
          {screen === "login" && (
            <div className="h-full flex flex-col pt-14 overflow-y-auto">
              <div className="flex flex-col items-center gap-2 px-8 pt-6 pb-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Recycle className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl font-black text-foreground">Welcome back!</h2>
                <p className="text-muted-foreground text-sm">Sign in to your Waste2Goods account</p>
              </div>
              <div className="px-6 flex-1 space-y-4">
                <Field
                  label="Email Address"
                  placeholder="maria@email.com"
                  icon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={setEmail}
                />
                <Field
                  label="Password"
                  placeholder="••••••••"
                  type="password"
                  icon={<Lock className="w-4 h-4" />}
                  value={password}
                  onChange={setPassword}
                />
                <p className="text-right text-xs text-primary font-bold cursor-pointer">Forgot Password?</p>
                <button
                  onClick={async () => {
                    try {
                      await Waste2GoodsAPI.login(email, password);
                      go("home");
                    } catch (e) {
                      alert("Invalid credentials. Try email: resident@cabantian.ph or admin@waste2goods.ph");
                    }
                  }}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-black text-base hover:bg-green-700 transition-colors"
                >
                  Sign In
                </button>
                <div className="flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="flex-1 h-px bg-border" /></div>
                <button className="w-full py-3 rounded-2xl border border-border text-sm font-semibold text-foreground flex items-center justify-center gap-2 hover:bg-secondary transition-colors">
                  🇵🇭 Continue with Barangay ID
                </button>
              </div>
              <p className="text-center text-xs text-muted-foreground py-6">New resident? <button onClick={() => go("register")} className="text-primary font-bold">Create account</button></p>
            </div>
          )}

          {/* ── HOME ── */}
          {screen === "home" && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="px-5 pt-14 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Good morning,</p>
                  <h2 className="text-xl font-black text-foreground">Maria Santos 👋</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button className="relative p-2 rounded-xl border border-border bg-white">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
                  </button>
                  <button onClick={() => go("profile")} className="w-9 h-9 rounded-full bg-primary text-white font-black text-sm flex items-center justify-center">MS</button>
                </div>
              </div>

              {/* Points hero */}
              <div className="mx-5 rounded-3xl p-5 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #15803d, #0ea5e9)" }}>
                <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #16a34a, transparent)" }} />
                <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/5" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold opacity-75 uppercase tracking-wide">Your Balance</span>
                    <Leaf className="w-4 h-4 opacity-60" />
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-5xl font-black tracking-tight">2,840</span>
                    <span className="text-base font-bold opacity-75 mb-1">pts</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">#3 Weekly</span>
                    <span className="text-xs opacity-70">·</span>
                    <span className="text-xs opacity-70">+320 pts today</span>
                    <span className="text-xs opacity-70">·</span>
                    <Flame className="w-3 h-3 text-orange-300" />
                    <span className="text-xs font-bold text-orange-200">7-day streak</span>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="px-5 mt-4 grid grid-cols-3 gap-2.5">
                {[
                  { icon: "♻️", label: "Submit", screen: "submit" as MobileScreen, bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
                  { icon: "🎁", label: "Rewards", screen: "rewards" as MobileScreen, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
                  { icon: "⚡", label: "Tasks", screen: "tasks" as MobileScreen, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
                ].map(a => (
                  <button key={a.label} onClick={() => go(a.screen)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl ${a.bg} border ${a.border} hover:shadow-md transition-all`}>
                    <span className="text-2xl">{a.icon}</span>
                    <span className={`text-xs font-black ${a.text}`}>{a.label}</span>
                  </button>
                ))}
              </div>

              {/* Leaderboard */}
              <div className="px-5 mt-4 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-foreground">Community Leaderboard</h3>
                  <div className="flex rounded-xl overflow-hidden border border-border text-xs">
                    {(["weekly","monthly"] as const).map(t => (
                      <button key={t} onClick={() => setLeaderTab(t)} className={`px-3 py-1.5 font-bold capitalize transition-colors ${leaderTab === t ? "bg-primary text-white" : "bg-white text-muted-foreground"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 pb-24">
                  {leaderboard.map(u => (
                    <div key={u.rank} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${u.isMe ? "border-primary/30 bg-green-50" : "border-border bg-white"}`}>
                      <div className="w-7 flex items-center justify-center flex-shrink-0"><RankIcon rank={u.rank} /></div>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${u.isMe ? "bg-primary" : "bg-slate-400"}`}>{u.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-foreground truncate">{u.name}{u.isMe ? " (You)" : ""}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Flame className="w-2.5 h-2.5 text-orange-400" />
                          <span className="text-xs text-muted-foreground">{u.streak}d streak</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-primary">{u.points.toLocaleString()} pts</span>
                    </div>
                  ))}
                </div>
              </div>
              <MobileBottomNav screen={screen} go={go} />
            </div>
          )}

          {/* ── SUBMIT: Entry ── */}
          {screen === "submit" && (
            <div className="h-full flex flex-col pt-14">
              <div className="px-5 pb-3 flex items-center gap-3 border-b border-border">
                <button onClick={() => go("home")}><ArrowLeft className="w-5 h-5" /></button>
                <h2 className="text-base font-black">Submit Recyclables</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-24">
                <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-green-50 p-8 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-foreground">Scan Kiosk QR Code</p>
                    <p className="text-xs text-muted-foreground mt-1">Open your camera and point it at the kiosk QR code to begin</p>
                  </div>
                  <button onClick={() => go("submit-scan")} className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-green-700 transition-colors flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Open Camera
                  </button>
                </div>
                <div className="rounded-2xl bg-white border border-border p-4">
                  <h3 className="text-sm font-black mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-amber-600" /> Point Rates</h3>
                  <div className="space-y-2">
                    {[["♻️ PET Plastic","50 pts/kg","bg-green-100 text-green-700"]].map(([t,p,cls]) => (
                      <div key={String(t)} className="flex justify-between items-center text-xs">
                        <span className="text-foreground font-semibold">{t}</span>
                        <span className={`font-black px-2 py-0.5 rounded-full ${cls}`}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-white border border-border p-4">
                  <h3 className="text-sm font-black mb-3">Nearby Kiosks</h3>
                  {kiosks.filter(k => k.status === "online").slice(0,3).map(k => (
                    <div key={k.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                      <div className="flex-1"><p className="text-xs font-bold text-foreground">{k.id}</p><p className="text-xs text-muted-foreground">{k.location}</p></div>
                      <span className="text-xs text-primary font-bold">{k.submissions} today</span>
                    </div>
                  ))}
                </div>
              </div>
              <MobileBottomNav screen={screen} go={go} />
            </div>
          )}

          {/* ── SUBMIT: Scanning ── */}
          {screen === "submit-scan" && (
            <div className="h-full flex flex-col" style={{ background: "#000" }}>
              <div className="px-5 pt-14 pb-4 flex items-center justify-between">
                <button onClick={() => go("submit")}><ArrowLeft className="w-5 h-5 text-white" /></button>
                <p className="text-white font-black text-sm">Scanning...</p>
                <div />
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-8 relative">
                {/* QR Scanner */}
                <div id="qr-reader" className="w-80 h-80 rounded-xl overflow-hidden" />
                <p className="text-white/70 text-sm text-center px-8">Point your camera at the QR code on the Waste2Goods kiosk</p>
              </div>
            </div>
          )}

          {/* ── SUBMIT: Confirm/Weighing ── */}
          {screen === "submit-confirm" && (
            <div className="h-full flex flex-col pt-14">
              <div className="px-5 pb-3 flex items-center gap-3 border-b border-border">
                <button onClick={() => go("submit")}><ArrowLeft className="w-5 h-5" /></button>
                <div>
                  <h2 className="text-base font-black">Confirm Submission</h2>
                  <p className="text-xs text-muted-foreground">K-01 · Bagong Pag-asa Hall</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-8">
                <div className="rounded-2xl bg-green-50 border border-primary/20 p-3 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-sm font-bold text-foreground">Kiosk connected successfully!</p>
                </div>
                <div className="rounded-2xl bg-white border border-border p-4 space-y-3">
                  <h3 className="text-sm font-black">Select Recyclable Type</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[["♻️","PET Plastic",true]].map(([e,l,sel]) => (
                      <button key={String(l)} className={`flex items-center gap-2 p-3 rounded-xl border-2 text-xs font-bold transition-colors ${sel ? "border-primary bg-green-50 text-primary" : "border-border bg-white text-muted-foreground"}`}>
                        <span className="text-lg">{String(e)}</span>{String(l)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live weight gauge */}
                <div className="rounded-2xl bg-white border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black flex items-center gap-2"><Scale className="w-4 h-4 text-primary" /> Live Weight</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${weighing ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{weighing ? "Measuring..." : "Place items"}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-5xl font-black text-foreground">{weight.toFixed(1)}</span>
                      <span className="text-lg font-bold text-muted-foreground ml-1">kg</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Points to earn</p>
                      <p className="text-3xl font-black text-primary">+{Math.round(weight * 50)}</p>
                    </div>
                  </div>
                  <div className="mt-3 w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${Math.min(100, (weight / 5) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 text-right">{weight.toFixed(2)} / 5.00 kg max</p>
                </div>

                <div className="rounded-2xl bg-white border border-border p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-bold">PET Plastic</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Weight</span><span className="font-bold">{weight.toFixed(2)} kg</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-bold">50 pts/kg</span></div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between"><span className="font-black">Points Earned</span><span className="font-black text-primary">+{Math.round(weight * 50)} pts</span></div>
                </div>
                <button onClick={() => go("submit-done")} className="w-full py-4 rounded-2xl bg-primary text-white font-black hover:bg-green-700 transition-colors">
                  Confirm & Submit
                </button>
              </div>
            </div>
          )}

          {/* ── SUBMIT: Done ── */}
          {screen === "submit-done" && (
            <div className="h-full flex flex-col items-center justify-center p-8 gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center">
                  <Check className="w-16 h-16 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 text-3xl animate-bounce">🎉</div>
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black text-foreground">Awesome!</h2>
                <p className="text-muted-foreground text-sm mt-1">Submission recorded successfully</p>
              </div>
              <div className="w-full rounded-2xl bg-white border border-border p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Previous balance</span><span className="font-bold">2,725 pts</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Points earned</span><span className="font-bold text-primary">+115 pts</span></div>
                <div className="h-px bg-border" />
                <div className="flex justify-between"><span className="font-black text-base">New balance</span><span className="font-black text-primary text-base">2,840 pts</span></div>
              </div>
              <div className="w-full rounded-2xl bg-blue-50 border border-blue-200 p-3 flex items-center gap-3">
                <Trophy className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-700 font-semibold">You rose to <strong>#3</strong> on the weekly leaderboard! 🏆</p>
              </div>
              <div className="w-full rounded-2xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-3">
                <Flame className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700 font-semibold">7-day streak maintained! Keep it up!</p>
              </div>
              <button onClick={() => go("home")} className="w-full py-4 rounded-2xl bg-primary text-white font-black">Back to Home</button>
            </div>
          )}

          {/* ── REWARDS ── */}
          {screen === "rewards" && (
            <div className="h-full flex flex-col pt-14">
              <div className="px-5 pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black">Rewards Catalog</h2>
                  <button onClick={() => go("redeem-history")} className="text-xs text-primary font-bold flex items-center gap-1"><Clock className="w-3 h-3" />History</button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Balance: <span className="font-black text-primary">2,840 pts</span></p>
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {rewardCategories.map(c => (
                    <button key={c} onClick={() => setRewardFilter(c)} className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-colors ${rewardFilter === c ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{c}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 pb-24">
                <div className="grid grid-cols-2 gap-3">
                  {filteredRewards.map(r => (
                    <div key={r.id} className="rounded-2xl bg-white border border-border p-3 flex flex-col gap-2 relative">
                      {r.seasonal && <div className="absolute top-2 right-2 text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">⭐ Seasonal</div>}
                      <div className="text-3xl mt-1">{r.icon}</div>
                      <div>
                        <p className="text-xs font-black text-foreground leading-snug pr-12">{r.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.category}</p>
                      </div>
                      {r.stock < 10 && <p className="text-xs text-red-600 font-bold">Only {r.stock} left!</p>}
                      <div className="flex items-center justify-between mt-auto pt-1">
                        <span className="text-sm font-black text-primary">{r.points} pts</span>
                        <button onClick={() => { setSelectedReward(r); go("redeem-confirm"); }} className={`text-xs px-2.5 py-1.5 rounded-xl font-bold transition-colors ${r.points <= 2840 ? "bg-primary text-white hover:bg-green-700" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                          {r.points <= 2840 ? "Redeem" : "Need more"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <MobileBottomNav screen={screen} go={go} />
            </div>
          )}

          {/* ── REDEEM CONFIRM ── */}
          {screen === "redeem-confirm" && selectedReward && (
            <div className="h-full flex flex-col pt-14">
              <div className="px-5 pb-3 flex items-center gap-3 border-b border-border">
                <button onClick={() => go("rewards")}><ArrowLeft className="w-5 h-5" /></button>
                <h2 className="text-base font-black">Confirm Redemption</h2>
              </div>
              <div className="flex-1 p-6 flex flex-col gap-5">
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="text-6xl">{selectedReward.icon}</div>
                  <h3 className="text-xl font-black text-foreground text-center">{selectedReward.name}</h3>
                  <span className="text-sm font-semibold px-3 py-1 rounded-full bg-secondary text-secondary-foreground">{selectedReward.category}</span>
                </div>
                <div className="rounded-2xl bg-white border border-border p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Current balance</span><span className="font-bold">2,840 pts</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Cost</span><span className="font-bold text-red-600">−{selectedReward.points} pts</span></div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between"><span className="font-black">Remaining balance</span><span className="font-black text-primary">{(2840 - selectedReward.points).toLocaleString()} pts</span></div>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 flex gap-2">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 font-semibold">Pick up your reward at the Barangay Hall within 7 days. Bring a valid ID.</p>
                </div>
                <div className="mt-auto space-y-3">
                  <button onClick={() => { setSelectedReward(null); go("rewards"); }} className="w-full py-4 rounded-2xl bg-primary text-white font-black hover:bg-green-700 transition-colors">Confirm Redemption</button>
                  <button onClick={() => go("rewards")} className="w-full py-3 rounded-2xl border border-border text-sm font-bold text-foreground hover:bg-secondary transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* ── REDEEM HISTORY ── */}
          {screen === "redeem-history" && (
            <div className="h-full flex flex-col pt-14">
              <div className="px-5 pb-3 flex items-center gap-3 border-b border-border">
                <button onClick={() => go("rewards")}><ArrowLeft className="w-5 h-5" /></button>
                <h2 className="text-base font-black">Redemption History</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {[
                  { date: "Jun 15, 2026", item: "Eco Water Bottle", pts: 350, status: "ready" },
                  { date: "May 28, 2026", item: "School Supplies Kit", pts: 500, status: "claimed" },
                  { date: "Apr 10, 2026", item: "Grocery Voucher ₱100", pts: 800, status: "claimed" },
                ].map((h, i) => (
                  <div key={i} className="rounded-2xl bg-white border border-border p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">🎁</div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-foreground">{h.item}</p>
                      <p className="text-xs text-muted-foreground">{h.date} · {h.pts} pts</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${h.status === "ready" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{h.status === "ready" ? "Ready to pick up" : "Claimed"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TASKS ── */}
          {screen === "tasks" && (
            <div className="h-full flex flex-col pt-14">
              <div className="px-5 pb-3 border-b border-border">
                <h2 className="text-base font-black">Tasks & Challenges</h2>
                <p className="text-xs text-muted-foreground">Complete tasks to earn bonus points</p>
              </div>
              <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-3">
                <div className="rounded-2xl p-3 text-white flex items-center gap-3" style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)" }}>
                  <Flame className="w-6 h-6 text-white flex-shrink-0" />
                  <div>
                    <p className="font-black text-sm">7-Day Streak Active!</p>
                    <p className="text-xs opacity-80">Keep submitting daily to earn the streak bonus</p>
                  </div>
                </div>
                {tasks.map(t => (
                  <div key={t.id} className={`rounded-2xl bg-white border p-4 ${t.done ? "border-primary/30 bg-green-50" : "border-border"}`}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${t.type==="daily"?"bg-blue-100 text-blue-700":t.type==="weekly"?"bg-purple-100 text-purple-700":"bg-amber-100 text-amber-700"}`}>{t.type}</span>
                          {t.done && <span className="text-xs font-bold text-green-700 flex items-center gap-0.5"><Check className="w-3 h-3" />Complete</span>}
                        </div>
                        <p className="text-sm font-bold text-foreground">{t.title}</p>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-center bg-amber-50 rounded-xl p-2 min-w-[48px]">
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-xs font-black text-amber-700 mt-0.5">+{t.reward}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-bold">{t.progress} / {t.goal} {t.unit}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100,(t.progress/t.goal)*100)}%`, background: t.done ? "#16a34a" : undefined }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <MobileBottomNav screen={screen} go={go} />
            </div>
          )}

          {/* ── PROFILE ── */}
          {screen === "profile" && (
            <div className="h-full flex flex-col">
              <div className="pt-14 pb-6 px-5 flex flex-col items-center gap-3" style={{ background: "linear-gradient(160deg, #052e16, #15803d)" }}>
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-3 border-white/30 bg-white/10 flex items-center justify-center text-2xl font-black text-white">MS</div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-green-900 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-black text-white">Maria Santos</h2>
                  <p className="text-xs text-green-300 flex items-center gap-1 justify-center"><MapPin className="w-3 h-3" />Bagong Pag-asa · Since Mar 2025</p>
                </div>
                <div className="flex gap-6 mt-1 bg-white/10 rounded-2xl px-6 py-3 border border-white/10">
                  {[["2,840","Points"],["34","Submissions"],["#3","Weekly Rank"]].map(([v,l]) => (
                    <div key={l} className="text-center">
                      <p className="text-base font-black text-white">{v}</p>
                      <p className="text-xs text-green-300">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-2">
                {[
                  { icon: <Activity className="w-4 h-4" />, label: "Transaction History", action: () => go("history"), color: "bg-blue-100 text-blue-600" },
                  { icon: <Settings className="w-4 h-4" />, label: "Account Settings", action: () => go("settings"), color: "bg-purple-100 text-purple-600" },
                  { icon: <Shield className="w-4 h-4" />, label: "Security & MFA", action: () => {}, color: "bg-green-100 text-green-700" },
                  { icon: <Bell className="w-4 h-4" />, label: "Notifications", action: () => {}, color: "bg-amber-100 text-amber-600" },
                  { icon: <Globe className="w-4 h-4" />, label: "Language & Region", action: () => {}, color: "bg-cyan-100 text-cyan-600" },
                  { icon: <HelpCircle className="w-4 h-4" />, label: "Help & FAQ", action: () => {}, color: "bg-slate-100 text-slate-600" },
                  { icon: <LogOut className="w-4 h-4 text-red-600" />, label: "Sign Out", action: () => { Waste2GoodsAPI.logout(); go("login"); }, color: "bg-red-100 text-red-600" },
                ].map(item => (
                  <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-border hover:bg-secondary transition-colors">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.color}`}>{item.icon}</div>
                    <span className="text-sm font-bold text-foreground flex-1 text-left">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <MobileBottomNav screen={screen} go={go} />
            </div>
          )}

          {/* ── HISTORY ── */}
          {screen === "history" && (
            <div className="h-full flex flex-col pt-14">
              <div className="px-5 pb-3 flex items-center gap-3 border-b border-border">
                <button onClick={() => go("profile")}><ArrowLeft className="w-5 h-5" /></button>
                <h2 className="text-base font-black">Transaction History</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {transactions.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-border">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type==="earn"?"bg-green-100":t.type==="redeem"?"bg-blue-100":"bg-amber-100"}`}>
                      {t.type==="earn"?<Recycle className="w-4 h-4 text-green-700" />:t.type==="redeem"?<Gift className="w-4 h-4 text-blue-700" />:<Zap className="w-4 h-4 text-amber-700" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{t.desc}</p>
                      <p className="text-xs text-muted-foreground">{t.date} · {t.id}</p>
                    </div>
                    <span className={`text-sm font-black flex-shrink-0 ${t.pts > 0 ? "text-primary" : "text-red-600"}`}>{t.pts > 0 ? "+" : ""}{t.pts}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {screen === "settings" && (
            <div className="h-full flex flex-col pt-14">
              <div className="px-5 pb-3 flex items-center gap-3 border-b border-border">
                <button onClick={() => go("profile")}><ArrowLeft className="w-5 h-5" /></button>
                <h2 className="text-base font-black">Account Settings</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {[["Full Name","Maria Santos"],["Email","maria.santos@gmail.com"],["Phone","+63 912 345 6789"],["Barangay","Bagong Pag-asa"]].map(([l,v]) => (
                  <div key={l}>
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">{l}</label>
                    <div className="flex items-center gap-2">
                      <input defaultValue={v} className="flex-1 px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      <button className="p-2 rounded-xl border border-border hover:bg-secondary"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                  </div>
                ))}
                <button className="w-full py-4 rounded-2xl bg-primary text-white font-black mt-4">Save Changes</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
