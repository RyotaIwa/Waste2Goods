
import { useState, useEffect, useRef, useMemo } from "react";
import { Waste2GoodsAPI, getApiHost, setApiHost, getApiBaseUrl, testApiConnection } from "@waste2goods/core";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  Smartphone, Monitor, Cpu, Recycle, Home, QrCode, Gift,
  Target, User, ArrowLeft, Check, AlertCircle, Scale, CheckCircle,
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
  | "tasks" | "profile" | "history" | "settings" | "notifications";

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
const DEMO_LEADERBOARD_FALLBACK = [
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

function Field({ label, placeholder, type = "text", icon, value, onChange, defaultValue, defaultVal }: { label: string; placeholder: string; type?: string; icon?: React.ReactNode; value?: string; onChange?: (value: string) => void; defaultValue?: string; defaultVal?: string }) {
  const initialValue = value !== undefined ? value : (defaultValue ?? defaultVal);
  return (
    <div>
      <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
        <input
          type={type}
          value={initialValue}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40`}
        />
      </div>
    </div>
  );
}

function SelectField({
  label,
  placeholder,
  icon,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  placeholder: string;
  icon?: React.ReactNode;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">{icon}</div>}
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${icon ? "pl-10" : "pl-4"} pr-10 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed`}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

// ── Functional Redemption (REAL DB writes via POST /api/rewards/redeem) ──
function RedeemConfirmScreen({
  reward,
  currentUser,
  onBack,
  onCancel,
}: {
  reward: { id?: any; rewardId?: any; name: string; icon: string; category: string; points: number; stock?: number; };
  currentUser: { id?: string; userId?: string; points: number; name: string; };
  onBack: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<null | { newBalance: number; redemptionId: string; rewardName: string; message: string }>(null);
  const remaining = Math.max(0, currentUser.points - reward.points);
  const disabled = loading || !!success || currentUser.points < reward.points;

  const confirm = async () => {
    setError("");
    setLoading(true);
    try {
      const userId = currentUser.id || currentUser.userId || "";
      if (!userId) throw new Error("Please login (or register) first before redeeming.");
      if (currentUser.points < reward.points) throw new Error("Not enough points to redeem this item.");
      const rewardIdVal = reward.rewardId ?? reward.id;
      if (rewardIdVal === undefined || rewardIdVal === null || rewardIdVal === "") throw new Error("Reward id missing.");
      const res = await Waste2GoodsAPI.redeemReward({
        userId,
        rewardId: rewardIdVal,
        quantity: 1,
      });
      if (!res?.ok) {
        throw new Error((res as any)?.error || "Redemption failed.");
      }
      setSuccess({
        newBalance: Number((res as any).newBalance ?? 0),
        redemptionId: (res as any).redemptionId || "",
        rewardName: (res as any).rewardName || reward.name,
        message: (res as any).message || "Ready for pick-up.",
      });
      // Reflect updated balance in auth state (so UI reads correct number on next screen visit)
      try {
        const AUTH_STORAGE_KEY = "w2g_auth_state";
        const auth = Waste2GoodsAPI.getAuthState();
        if (auth?.user) {
          const patchedUser = { ...auth.user, points: Number((res as any).newBalance ?? 0), pointsBalance: Number((res as any).newBalance ?? 0) };
          const patchedAuth = { ...auth, user: patchedUser, isAuthenticated: true };
          // Write directly to localStorage with the EXACT same key the core API reads from:
          try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(patchedAuth)); } catch {}
        }
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Redemption failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
      <div className="sticky top-0 z-10 px-5 pb-3 pt-3 flex items-center gap-3 border-b border-border bg-background" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
        <button onClick={onCancel}><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-base font-black">Confirm Redemption</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-8">
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="text-6xl">{reward.icon}</div>
          <h3 className="text-xl font-black text-foreground text-center">{reward.name}</h3>
          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-secondary text-secondary-foreground">{reward.category}</span>
        </div>

        <div className="rounded-2xl bg-white border border-border p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Current balance</span><span className="font-bold">{currentUser.points.toLocaleString()} pts</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Cost</span><span className="font-bold text-red-600">−{reward.points} pts</span></div>
          <div className="h-px bg-border" />
          <div className="flex justify-between"><span className="font-black">Remaining balance</span><span className="font-black text-primary">{remaining.toLocaleString()} pts</span></div>
        </div>

        {reward.stock !== undefined && reward.stock < 10 && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-semibold">Only {reward.stock} left! Claim now before stock runs out.</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-foreground">Redemption confirmed! 🎉</p>
                <p className="text-xs text-muted-foreground">Reference #: {success.redemptionId}</p>
                <p className="text-xs text-green-800 mt-1 font-semibold">{success.message}</p>
                <p className="text-xs text-muted-foreground mt-1">New balance: <strong className="text-primary">{success.newBalance.toLocaleString()} pts</strong></p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 flex gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 font-semibold">Pick up your reward at the Barangay Hall within 7 days. Bring a valid ID.</p>
        </div>

        <div className="mt-auto space-y-3">
          <button
            onClick={confirm}
            disabled={disabled}
            className="w-full py-4 rounded-2xl bg-primary text-white font-black hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : success ? (
              <>✅ Done — back to Rewards Catalog</>
            ) : (
              "Confirm Redemption"
            )}
          </button>
          <button
            onClick={success ? onCancel : onBack}
            className="w-full py-3 rounded-2xl border border-border text-sm font-bold text-foreground hover:bg-secondary transition-colors"
          >
            {success ? "Back to Rewards" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ServerIpPanel({
  apiHost,
  setApiHostState,
  onSaved,
  compact,
}: {
  apiHost: string;
  setApiHostState: (v: string) => void;
  onSaved?: (msg: { type: "ok" | "err"; text: string }) => void;
  compact?: boolean;
}) {
  const [testing, setTesting] = useState(false);
  const save = () => {
    const trimmed = apiHost.trim();
    if (!trimmed) {
      onSaved?.({ type: "err", text: "Please enter an IP address or hostname" });
      return;
    }
    setApiHost(trimmed);
    onSaved?.({ type: "ok", text: `✅ Server saved: http://${trimmed}:3001 — no APK rebuild needed. This setting is saved on your device.` });
  };
  const test = async () => {
    const trimmed = apiHost.trim();
    if (!trimmed) {
      onSaved?.({ type: "err", text: "Please enter an IP address first" });
      return;
    }
    setTesting(true);
    setApiHost(trimmed);
    const result = await testApiConnection();
    onSaved?.({ type: result.ok ? "ok" : "err", text: result.message });
    setTesting(false);
  };
  const resetToDefault = () => {
    setApiHostState("localhost");
    setApiHost("localhost");
    onSaved?.({ type: "ok", text: "Reset to localhost — use this when the backend runs on the same PC." });
  };
  return (
    <div className={`rounded-2xl bg-blue-50 border border-blue-200 space-y-2.5 ${compact ? "p-2.5" : "p-4"}`}>
      <div className="flex items-start gap-2">
        <Globe className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-blue-800 uppercase tracking-wide">Backend Server IP</p>
          <p className="text-[11px] text-blue-700 leading-snug">
            Enter your PC's <strong>LAN IP</strong>. Saved on device — no rebuild after Wi‑Fi changes.
          </p>
        </div>
      </div>
      <div>
        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wide mb-1 block">PC IP Address</label>
        <input
          type="text"
          value={apiHost}
          onChange={e => setApiHostState(e.target.value)}
          placeholder="e.g. 192.168.1.100 or localhost"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
        />
        <div className="flex items-center justify-between mt-1 gap-2">
          <p className="text-[10px] text-blue-600 font-mono truncate min-w-0">→ {getApiBaseUrl()}</p>
          <button
            type="button"
            onClick={resetToDefault}
            className="text-[10px] font-bold text-blue-700 hover:underline flex-shrink-0 whitespace-nowrap"
          >
            Reset to localhost
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          className={`flex-1 ${compact ? "py-2.5 text-xs" : "py-3 text-sm"} rounded-xl bg-primary text-white font-black hover:bg-green-700 transition-colors`}
        >
          💾 Save IP
        </button>
        <button
          type="button"
          onClick={test}
          disabled={testing}
          className={`flex-1 ${compact ? "py-2.5 text-xs" : "py-3 text-sm"} rounded-xl border border-blue-300 bg-white text-blue-800 font-black disabled:opacity-60 hover:bg-blue-50 transition-colors`}
        >
          {testing ? (
            <span className="inline-flex items-center justify-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing…
            </span>
          ) : "🔌 Test"}
        </button>
      </div>
      {!compact && (
        <div className="rounded-xl bg-white/60 border border-blue-100 p-2.5 text-[11px] text-blue-800 leading-snug space-y-1">
          <p><strong>💡 Tip:</strong> To find your PC's LAN IP:</p>
          <ul className="list-disc list-inside space-y-0.5 pl-1">
            <li>Windows: Open CMD → type <span className="font-mono">ipconfig</span> → look for <strong>IPv4 Address</strong></li>
            <li>Mac/Linux: Terminal → type <span className="font-mono">ifconfig</span> or <span className="font-mono">ip a</span></li>
          </ul>
        </div>
      )}
    </div>
  );
}

function KioskLinkBadge({
  connected,
  kioskId,
  checking,
  connectedAt,
  onDisconnect,
}: {
  connected: boolean;
  kioskId?: string;
  checking?: boolean;
  connectedAt?: number;
  onDisconnect?: () => void;
}) {
  const elapsed = connectedAt ? Math.floor((Date.now() - connectedAt) / 1000) : 0;
  const elapsedLabel = (() => {
    if (!connectedAt) return "";
    if (elapsed < 60) return `${elapsed}s`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
    return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
  })();
  return (
    <div
      className={`w-full rounded-xl px-3 py-2.5 flex items-center gap-2 border text-xs font-bold ${
        connected ? "bg-green-50 border-green-200 text-green-800" : "bg-slate-50 border-border text-muted-foreground"
      }`}
    >
      <Monitor className={`w-4 h-4 flex-shrink-0 ${connected ? "text-green-600" : ""}`} />
      <div className="flex-1 min-w-0">
        {checking && !connected ? (
          <span className="truncate">Checking kiosk link…</span>
        ) : connected ? (
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span>Kiosk linked · <strong className="truncate">{kioskId || "K-01"}</strong></span>
            {elapsedLabel && (
              <>
                <span className="text-green-600/70 font-normal">·</span>
                <span className="text-[10px] font-semibold text-green-700/80">{elapsedLabel} elapsed</span>
              </>
            )}
            <span className="block w-full text-[10px] font-semibold text-green-700/80 -mt-0.5">
              You can submit PET plastic at this kiosk
            </span>
          </div>
        ) : (
          <span className="truncate">No kiosk linked — scan the kiosk QR via Submit tab</span>
        )}
      </div>
      {checking && <RefreshCw className="w-3 h-3 ml-auto animate-spin flex-shrink-0 opacity-60" />}
      {connected && !checking && (
        <>
          <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="Connected" />
          {onDisconnect && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDisconnect(); }}
              className="ml-1 text-[10px] font-bold px-2 py-1 rounded-lg border border-green-300 bg-white/60 text-green-800 hover:bg-green-100 transition-colors flex-shrink-0"
              title="End this kiosk session"
            >
              Disconnect
            </button>
          )}
        </>
      )}
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
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-2 pt-2 flex justify-around z-20" style={{ paddingBottom: "calc(0.5rem + var(--sab))" }}>
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  // Registration form state
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regProvince, setRegProvince] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regBarangay, setRegBarangay] = useState("");
  const [regStreetAddress, setRegStreetAddress] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  // ── Profile state (refreshed from DB when profile screen opens) ──
  // Initialize immediately from localStorage so the greeting never shows
  // "Guest User" flash on a real logged-in session (persistent auth restore).
  const [profileUser, setProfileUser] = useState<any | null>(() => {
    try {
      const raw = localStorage.getItem("w2g_auth_state");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.user && (parsed.user.id || parsed.user.userId) ? { ...parsed.user } : null;
    } catch {
      return null;
    }
  });
  const [profileRank, setProfileRank] = useState<string>("#-");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileBanner, setProfileBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  // Live editable settings form (defaultValue on inputs is broken without controlled state)
  const [setFName, setSetFName] = useState("");
  const [setLName, setSetLName] = useState("");
  const [setFormEmail, setSetFormEmail] = useState("");
  const [setPhone, setSetPhone] = useState("");
  const [setBrgy, setSetBrgy] = useState("");
  const [setCity, setSetCity] = useState("");
  const [setProvince, setSetProvince] = useState("");
  // ── Live leaderboard from DB (fallback to DEMO_LEADERBOARD_FALLBACK if API unavailable) ──
  const [liveLeaderboard, setLiveLeaderboard] = useState<any[] | null>(null);
  // ── Notifications state (for mobile 🔔 bell) ──
  const [notifItems, setNotifItems] = useState<any[]>([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [kioskSession, setKioskSession] = useState<{ connected: boolean; kioskId?: string; connectedAt?: number }>({ connected: false });
  const [kioskChecking, setKioskChecking] = useState(false);
  const [apiHost, setApiHostState] = useState(() => getApiHost());
  const [showLoginServer, setShowLoginServer] = useState(() => {
    try {
      const hasSetIp = localStorage.getItem("w2g_api_host");
      return !hasSetIp;
    } catch {
      return true;
    }
  });
  const [loginServerBanner, setLoginServerBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const weight = useAnimatedWeight(2.3, weighing);
  const mfaRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Philippine Location Data: Province → Cities → Barangays (sample subset with Cabantian, Davao)
  const PH_LOCATIONS: Record<string, Record<string, string[]>> = {
    "Davao del Sur": {
      "Davao City": ["Cabantian", "Buhangin", "Poblacion", "Matina", "Toril", "Tugbok", "Calinan", "Marilog", "Baguio", "Paquibato"],
      "Digos City": ["Barangay 1 Pob.", "Barangay 2 Pob.", "San Jose", "San Miguel", "Aplaya"],
      "Sta. Cruz": ["Poblacion", "Sibulan", "Darong", "Inauayan", "Bato"],
    },
    "Metro Manila": {
      "Quezon City": ["Diliman", "Loyola Heights", "Project 4", "Kamuning", "Commonwealth", "Batasan Hills"],
      "Manila": ["Sampaloc", "Ermita", "Malate", "Quiapo", "Tondo", "Pasay"],
      "Makati City": ["Poblacion", "Bel-Air", "San Lorenzo", "Urdaneta", "Forbes Park"],
      "Taguig City": ["BGC", "Upper Bicutan", "Lower Bicutan", "Hagonoy", "Tuktukan"],
    },
    "Cebu": {
      "Cebu City": ["Lahug", "Cebu Business Park", "Mabolo", "Talamban", "Poblacion Pardo", "San Nicolas"],
      "Mandaue City": ["Centro", "Canduman", "Maguikay", "Opao", "Tabok"],
      "Lapu-Lapu City": ["Punta Engaño", "Lapu-Lapu Pob.", "Marigondon", "Mactan"],
    },
    "Bukidnon": {
      "Valencia City": ["Poblacion", "Bagontaas", "Lumbayao", "Batangan", "Guinoyuran"],
      "Malaybalay City": ["Poblacion", "Sumpong", "Pal-ing", "Linabo", "Casisang"],
    },
    "Misamis Oriental": {
      "Cagayan de Oro": ["Pueblo de Oro", "Liceo", "Divisoria", "Carmen", "Macasandig", "Bulua"],
    },
    "South Cotabato": {
      "General Santos": ["Poblacion", "San Jose", "Calumpang", "Bula", "Conel", "Fatima"],
    },
    "Davao de Oro": {
      "Compostela": ["Poblacion", "San Jose", "Moncado", "Maparat", "Ngan"],
    },
    "Davao Oriental": {
      "Mati City": ["Dahican", "Poblacion", "Sainz", "Macambol", "Badas"],
    },
    "Davao del Norte": {
      "Panabo City": ["Poblacion", "Kasilak", "San Francisco", "Quezon", "Cacao"],
      "Tagum City": ["Poblacion", "Madaum", "San Agustin", "Apokon", "Liboganon"],
    },
  };
  const PROVINCES = Object.keys(PH_LOCATIONS).sort();

  const availableCities = regProvince ? Object.keys(PH_LOCATIONS[regProvince] || {}).sort() : [];
  const availableBarangays =
    regProvince && regCity ? (PH_LOCATIONS[regProvince]?.[regCity] || []).sort() : [];

  const go = (s: MobileScreen) => setScreen(s);

  useEffect(() => {
    if (screen === "splash") {
      // PERSISTENT AUTH: Do NOT logout on every app launch.
      // Instead check localStorage for a valid saved session — if found,
      // skip onboarding and jump straight to Home (user stays signed in
      // until they explicitly tap "Sign Out" on the Profile screen).
      const t = setTimeout(() => {
        const existing = Waste2GoodsAPI.getAuthState();
        if (existing && existing.isAuthenticated && existing.token && existing.user) {
          go("home");
        } else {
          go("onboard1");
        }
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [screen]);

  // AUTH GUARD: If screen is a protected route but no valid auth token, force back to login.
  // (Prevents stale state or manual state tampering from bypassing sign-in.)
  useEffect(() => {
    const unprotected: MobileScreen[] = [
      "splash", "onboard1", "onboard2", "onboard3",
      "login", "register", "mfa", "profile-setup"
    ];
    if (!unprotected.includes(screen)) {
      const auth = Waste2GoodsAPI.getAuthState();
      if (!auth || !auth.isAuthenticated || !auth.token) {
        console.log("🔐 Mobile auth guard: no valid token — returning to login");
        Waste2GoodsAPI.logout();
        setScreen("login");
      }
    }
  }, [screen]);

  // Helper to get current user's display data — reactive (reads from profileUser state when set)
  const currentUser = useMemo(() => {
    const userObj = profileUser || Waste2GoodsAPI.getAuthState()?.user || null;
    if (userObj) {
      const rawName = (userObj.name || `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim()) as string;
      const fallbackFromFlds = `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim();
      const id = (userObj as any).id || (userObj as any).userId || "";
      // If user has a real id (authenticated), NEVER show "Guest User" — prefer empty/initials over confusing Guest fallback
      const name = rawName || fallbackFromFlds || (id ? "" : "Guest User");
      const initials = (name || `${userObj.firstName || ""} ${userObj.lastName || ""}` || (id ? "U" : ""))
        .split(/\s+/)
        .filter(Boolean)
        .map((p: string) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      const points = (userObj as any).points ?? (userObj as any).pointsBalance ?? 0;
      return {
        id,
        userId: id,
        name,
        initials: initials || (id ? "U" : "GU"),
        email: (userObj as any).email || "",
        phone: (userObj as any).phone || "",
        barangay: (userObj as any).barangay || (userObj as any).barangayName || "Cabantian",
        barangayName: (userObj as any).barangayName || (userObj as any).barangay || "",
        province: (userObj as any).province || "",
        city: (userObj as any).city || "",
        streetAddress: (userObj as any).streetAddress || "",
        points: Number(points) || 0,
        submissions: Number((userObj as any).submissions ?? (userObj as any).totalSubmissions ?? 0) || 0,
        redeemed: Number((userObj as any).redeemed || 0),
        joined: (userObj as any).joined || "",
        createdAt: (userObj as any).createdAt || null,
        firstName: (userObj as any).firstName || "",
        lastName: (userObj as any).lastName || "",
      };
    }
    return {
      id: "",
      userId: "",
      name: "",
      initials: "",
      email: "",
      phone: "",
      barangay: "Cabantian",
      barangayName: "Cabantian",
      province: "Davao del Sur",
      city: "Davao City",
      streetAddress: "",
      points: 0,
      submissions: 0,
      redeemed: 0,
      joined: "",
      createdAt: null,
      firstName: "",
      lastName: "",
    };
  }, [profileUser]);

  // Merged leaderboard: prefer live DB rows (with correct user names from MySQL),
  // otherwise fall back to the demo placeholder list. Always returns a non-empty array
  // so the Community Leaderboard panel never appears empty.
  const mergedLeaderboard = useMemo(() => {
    const auth = (() => {
      try { return Waste2GoodsAPI.getAuthState()?.user || null; } catch { return null; }
    })();
    const myId = String(auth?.id || auth?.userId || currentUser.id || currentUser.userId || "").toUpperCase();
    if (liveLeaderboard && liveLeaderboard.length > 0) {
      return liveLeaderboard.slice(0, 10).map((u: any, i: number) => {
        const rank = Number(u.rank) || i + 1;
        const firstName = u.firstName || "";
        const lastName = u.lastName || "";
        const name = (u.name && u.name.trim() !== "") ? u.name : [firstName, lastName].filter(Boolean).join(" ").trim() || u.userId || "Resident";
        const pts = Number(u.points ?? u.pointsBalance ?? 0);
        const subs = Number(u.submissions ?? u.totalSubmissions ?? 0);
        const uid = String(u.userId ?? u.id ?? "").toUpperCase();
        const isMe = !!myId && !!uid && uid === myId;
        const avatarChars = (name || "RU")
          .split(/\s+/)
          .filter(Boolean)
          .map(p => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        return {
          rank,
          name,
          barangay: u.barangay || u.barangayName || currentUser.barangay || "Cabantian",
          points: pts,
          submissions: subs,
          avatar: avatarChars || "RU",
          streak: Number(u.streak) || subs > 0 ? Math.min(30, Math.max(1, Math.ceil(subs / 2))) : 1,
          isMe,
          userId: uid,
        };
      });
    }
    return DEMO_LEADERBOARD_FALLBACK.map((u, i) => ({
      ...u,
      rank: i + 1,
      isMe: false,
    }));
  }, [liveLeaderboard, currentUser.id, currentUser.userId, currentUser.barangay]);

  // When user opens Profile, Settings, or History — re-pull their latest DB row
  // (points, submissions, name) and their current leaderboard rank.
  // Also seed the editable settings form fields so the "Save Changes" button works.
  useEffect(() => {
    if (!["profile", "settings", "history"].includes(screen)) return;
    let cancelled = false;
    (async () => {
      setProfileBanner(null);
      // Refresh user from GET /users/:id and sync to localStorage
      const refreshed = Waste2GoodsAPI.refreshCurrentUser ? await Waste2GoodsAPI.refreshCurrentUser() : null;
      if (cancelled) return;
      if (refreshed) setProfileUser({ ...refreshed });
      else setProfileUser({ ...(Waste2GoodsAPI.getAuthState()?.user || {}) });

      const rankPromise = Waste2GoodsAPI.getCurrentRank ? Waste2GoodsAPI.getCurrentRank() : Promise.resolve("#-");
      const rank = await rankPromise;
      if (cancelled) return;
      setProfileRank(rank || "#-");
    })();
    return () => { cancelled = true; };
  }, [screen]);

  // Fetch MY notifications (mobile 🔔 bell) when user enters Home or Notifications screen,
  // or just after login/authenticated screens to keep the red-dot badge accurate.
  // Also re-fetch whenever notifications screen is about to be entered for freshness.
  useEffect(() => {
    const authScreens: MobileScreen[] = ["home", "notifications", "profile", "tasks", "rewards", "submit", "history", "settings", "redeem-history", "redeem-confirm"];
    if (!authScreens.includes(screen)) return;
    let cancelled = false;
    (async () => {
      if (!Waste2GoodsAPI.getMyNotifications) return;
      const res = await Waste2GoodsAPI.getMyNotifications();
      if (cancelled || !res) return;
      setNotifItems(res.items || []);
      setNotifUnread(Number(res.unread || 0));
    })();
    return () => { cancelled = true; };
  }, [screen]);

  // Fetch LIVE leaderboard from real DB on Home + Rewards/Leaderboard views.
  // Falls back to DEMO_LEADERBOARD_FALLBACK silently if backend unreachable so UI stays clean.
  useEffect(() => {
    const watchScreens: MobileScreen[] = ["home", "rewards", "leaderboard"];
    if (!watchScreens.includes(screen)) return;
    let cancelled = false;
    (async () => {
      try {
        if (!Waste2GoodsAPI.fetchLeaderboard) return;
        const rows = await Waste2GoodsAPI.fetchLeaderboard();
        if (cancelled) return;
        setLiveLeaderboard(Array.isArray(rows) && rows.length > 0 ? rows : null);
      } catch (_) {
        if (!cancelled) setLiveLeaderboard(null);
      }
    })();
    return () => { cancelled = true; };
  }, [screen]);

  // Poll backend: is this user currently linked to a kiosk?
  // Also tick every second so the "elapsed" label in the badge refreshes in real-time
  const [, setKioskTick] = useState(0);
  useEffect(() => {
    const watchScreens: MobileScreen[] = ["home", "submit", "submit-scan", "submit-confirm", "submit-done", "profile", "settings", "tasks", "rewards"];
    if (!watchScreens.includes(screen)) return;
    const uid = currentUser.id || currentUser.userId;
    if (!uid) return;
    let cancelled = false;
    const poll = async () => {
      if (!Waste2GoodsAPI.getKioskSessionStatus) return;
      setKioskChecking(true);
      const res = await Waste2GoodsAPI.getKioskSessionStatus(uid);
      if (cancelled) return;
      setKioskChecking(false);
      if (!res) {
        setKioskSession({ connected: false });
        return;
      }
      setKioskSession(prev => ({
        connected: !!res.connected,
        kioskId: res.kioskId,
        connectedAt: res.connected
          ? (res.connectedAt ?? prev.connectedAt ?? Date.now())
          : undefined,
      }));
    };
    poll();
    const iv = setInterval(poll, 3000);
    const tickIv = setInterval(() => setKioskTick(t => t + 1), 1000);
    return () => { cancelled = true; clearInterval(iv); clearInterval(tickIv); };
  }, [screen, currentUser.id, currentUser.userId]);

  // Disconnect current kiosk session (callable from the badge)
  const handleDisconnectKiosk = async () => {
    const uid = currentUser.id || currentUser.userId;
    if (!uid) return;
    try {
      await Waste2GoodsAPI.disconnectKioskSession?.(uid);
    } catch { /* ignore */ }
    setKioskSession({ connected: false });
    try {
      localStorage.removeItem("w2g_kiosk_qr_bridge");
      window.dispatchEvent(new StorageEvent("storage", { key: "w2g_kiosk_qr_bridge" }));
    } catch { /* ignore */ }
  };

  // Seed the settings form inputs from currentUser whenever the screen opens
  useEffect(() => {
    if (screen !== "settings") return;
    // Split name → first/last for editable fields (else leave blank)
    const parts = (currentUser.name || "").trim().split(/\s+/);
    const first = currentUser.firstName || parts[0] || "";
    const last = currentUser.lastName || parts.slice(1).join(" ") || "";
    setSetFName(first);
    setSetLName(last);
    setSetFormEmail(currentUser.email || "");
    setSetPhone(currentUser.phone || "");
    setSetBrgy(currentUser.barangay || "");
    setSetCity(currentUser.city || "");
    setSetProvince(currentUser.province || "");
    setProfileBanner(null);
    setApiHostState(getApiHost());
  }, [screen, currentUser.id]);

  // Build the "Since Month Year" string from the user's actual createdAt row
  const profileSinceLabel = (() => {
    if (currentUser.joined) return `Since ${currentUser.joined}`;
    if (currentUser.createdAt) {
      try {
        return `Since ${new Date(currentUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
      } catch { /* ignore */ }
    }
    return "Since Today";
  })();

  // Handler for the Settings "Save Changes" button — PUTs to /users/:id via core helper
  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileBanner(null);
    try {
      const patches: any = {};
      if (setFName) patches.firstName = setFName;
      if (setLName) patches.lastName = setLName;
      if (setFormEmail) patches.email = setFormEmail;
      if (setPhone) patches.phone = setPhone;
      if (setProvince) patches.province = setProvince;
      if (setCity) patches.city = setCity;
      if (setBrgy) patches.barangayName = setBrgy;
      let ok = false;
      if (Waste2GoodsAPI.saveProfile) {
        ok = await Waste2GoodsAPI.saveProfile(patches);
      } else {
        // Fallback PUT
        const userId = currentUser.id || currentUser.userId;
        const res = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Waste2GoodsAPI.getAuthState()?.token || ""}` },
          body: JSON.stringify(patches),
        });
        ok = res.ok;
      }
      if (ok) {
        // Re-pull so profile + avatar update instantly
        const fresh = Waste2GoodsAPI.refreshCurrentUser ? await Waste2GoodsAPI.refreshCurrentUser() : null;
        if (fresh) setProfileUser({ ...fresh });
        setProfileBanner({ type: "ok", text: "✅ Profile saved successfully!" });
      } else {
        setProfileBanner({ type: "err", text: "⚠️ Failed to save. Check backend connection." });
      }
    } catch (e) {
      setProfileBanner({ type: "err", text: e instanceof Error ? e.message : "⚠️ Save failed" });
    } finally {
      setProfileSaving(false);
    }
  };

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
          console.log("QR code scanned:", decodedText);
          // Write QR BRIDGE so Kiosk (cross-tab) picks up this logged-in user
          // This is how the mobile signals the kiosk: "I am [user], connect me"
          try {
            const auth = Waste2GoodsAPI.getAuthState();
            const u = auth?.user || {};
            const bridgePayload = {
              user: {
                id: (u as any).id || (u as any).userId || currentUser.id || "U-001",
                userId: (u as any).id || (u as any).userId || currentUser.id || "U-001",
                name: currentUser.name && currentUser.name !== "Guest User" ? currentUser.name : (u as any).name || `${(u as any).firstName || ""} ${(u as any).lastName || ""}`.trim() || "Registered User",
                firstName: (u as any).firstName,
                lastName: (u as any).lastName,
                email: currentUser.email || (u as any).email || "",
                points: currentUser.points || (u as any).pointsBalance || 50,
                pointsBalance: currentUser.points || (u as any).pointsBalance || 50,
              },
              kioskPayload: decodedText,
              timestamp: Date.now(),
            };
            localStorage.setItem("w2g_kiosk_qr_bridge", JSON.stringify(bridgePayload));
            // Also emit cross-tab storage event for same-origin kiosk tabs already listening
            try { window.dispatchEvent(new StorageEvent("storage", { key: "w2g_kiosk_qr_bridge", newValue: JSON.stringify(bridgePayload) })); } catch {}
            Waste2GoodsAPI.connectKioskSession?.({
              userId: bridgePayload.user.id || bridgePayload.user.userId,
              userName: bridgePayload.user.name,
              kioskId: decodedText.includes("K-") ? decodedText : "K-01",
            });
            console.log("✅ QR bridge written to localStorage (kiosk should pick up user within ~800ms):", bridgePayload.user.name);
          } catch (bridgeErr) {
            console.warn("QR bridge write failed:", bridgeErr);
          }
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
    <div
      className="flex flex-col w-full bg-background"
      style={{
        background: "#f0fdf4",
        fontFamily: "'Nunito', sans-serif",
        height: "100dvh",
      }}
    >
      <div className="relative flex flex-col w-full flex-1 min-h-0" style={{ background: "#f0fdf4" }}>

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
            <div className="h-full min-h-[100dvh] flex flex-col max-w-xl w-full mx-auto" style={{ background: "linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)", paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
              <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
                <div className="w-48 h-48 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center" style={{ boxShadow: "0 20px 60px rgba(22,163,74,0.15)" }}>
                  <div className="text-8xl">♻️</div>
                </div>
                <div className="text-center">
                  <h2 className="text-3xl font-black text-foreground">Recycle for Rewards</h2>
                  <p className="text-muted-foreground text-sm mt-3 leading-relaxed">Bring your plastic bottles, cardboard, and metal cans to any Waste2Goods kiosk and earn points instantly.</p>
                </div>
              </div>
              <div className="px-8 space-y-4 shrink-0" style={{ paddingBottom: "calc(3rem + var(--sab))" }}>
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
            <div className="h-full min-h-[100dvh] flex flex-col max-w-xl w-full mx-auto" style={{ background: "linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)", paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
              <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
                <div className="w-48 h-48 rounded-full bg-blue-100 border-4 border-blue-200 flex items-center justify-center" style={{ boxShadow: "0 20px 60px rgba(14,165,233,0.15)" }}>
                  <div className="text-8xl">🏆</div>
                </div>
                <div className="text-center">
                  <h2 className="text-3xl font-black text-foreground">Climb the Leaderboard</h2>
                  <p className="text-muted-foreground text-sm mt-3 leading-relaxed">Compete with neighbors and earn special recognition. Top recyclers win bonus rewards each week.</p>
                </div>
              </div>
              <div className="px-8 space-y-4 shrink-0" style={{ paddingBottom: "calc(3rem + var(--sab))" }}>
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
            <div className="h-full min-h-[100dvh] flex flex-col max-w-xl w-full mx-auto" style={{ background: "linear-gradient(180deg, #fdf4ff 0%, #f3e8ff 100%)", paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
              <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
                <div className="w-48 h-48 rounded-full bg-purple-100 border-4 border-purple-200 flex items-center justify-center" style={{ boxShadow: "0 20px 60px rgba(139,92,246,0.15)" }}>
                  <div className="text-8xl">🎁</div>
                </div>
                <div className="text-center">
                  <h2 className="text-3xl font-black text-foreground">Redeem Real Rewards</h2>
                  <p className="text-muted-foreground text-sm mt-3 leading-relaxed">Exchange your points for school supplies, groceries, seedlings, and seasonal community prizes.</p>
                </div>
              </div>
              <div className="px-8 space-y-4 shrink-0" style={{ paddingBottom: "calc(3rem + var(--sab))" }}>
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
            <div className="h-full min-h-[100dvh] flex flex-col overflow-y-auto"
                 style={{ paddingTop: "calc(0.5rem + var(--sat))", paddingBottom: "calc(1.5rem + var(--sab))" }}>
              <div className="px-5 py-3 flex items-center gap-3 border-b border-border bg-white sticky top-0 z-20" style={{ top: "var(--sat)" }}>
                <button onClick={() => go("onboard3")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
                <div>
                  <h2 className="text-base font-black text-foreground">Create Account</h2>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3].map(s => <div key={s} className={`h-1 rounded-full transition-all ${regStep >= s-1 ? "bg-primary w-8" : "bg-muted w-4"}`} />)}
                  </div>
                </div>
              </div>
              <div className="p-5 md:p-8 flex-1 max-w-xl w-full mx-auto">
                {regStep === 0 && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-3">Step 1 of 3 — Account Info</p>
                      <div className="space-y-3">
                        <Field label="Full Name" placeholder="Maria Santos" icon={<User className="w-4 h-4" />} value={regFullName} onChange={setRegFullName} />
                        <Field label="Email Address" placeholder="maria@email.com" icon={<Mail className="w-4 h-4" />} value={regEmail} onChange={setRegEmail} />
                        <Field label="Phone Number" placeholder="+63 912 345 6789" icon={<Phone className="w-4 h-4" />} value={regPhone} onChange={setRegPhone} />
                        <Field label="Password" placeholder="••••••••" type="password" icon={<Lock className="w-4 h-4" />} value={regPassword} onChange={setRegPassword} />
                        <Field label="Confirm Password" placeholder="••••••••" type="password" icon={<Lock className="w-4 h-4" />} value={regConfirmPassword} onChange={setRegConfirmPassword} />
                      </div>
                    </div>
                    {regError && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
                        <AlertCircle className="w-4 h-4" />
                        <span>{regError}</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setRegError("");
                        if (!regFullName || !regEmail || !regPassword || !regConfirmPassword) {
                          setRegError("Please fill in all fields: name, email, phone, password, confirm password");
                          return;
                        }
                        if (regPassword !== regConfirmPassword) {
                          setRegError("Passwords do not match");
                          return;
                        }
                        if (regPassword.length < 6) {
                          setRegError("Password must be at least 6 characters");
                          return;
                        }
                        setRegStep(1);
                      }}
                      className="w-full py-4 rounded-2xl bg-primary text-white font-black"
                    >
                      Continue
                    </button>
                  </div>
                )}
                {regStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1">Step 2 of 3 — Community Address</p>
                    {regError && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
                        <AlertCircle className="w-4 h-4" />
                        <span>{regError}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mb-1">
                      Select your <strong>Province</strong> first — City and Barangay options will auto-filter based on your choice.
                    </p>
                    <SelectField
                      label="Province"
                      placeholder="Select a Province..."
                      icon={<MapPin className="w-4 h-4" />}
                      value={regProvince}
                      options={PROVINCES}
                      onChange={(v) => {
                        setRegProvince(v);
                        setRegCity("");
                        setRegBarangay("");
                      }}
                    />
                    <SelectField
                      label="City / Municipality"
                      placeholder={regProvince ? "Select a City..." : "Select a Province first"}
                      icon={<MapPin className="w-4 h-4" />}
                      value={regCity}
                      options={availableCities}
                      disabled={!regProvince}
                      onChange={(v) => {
                        setRegCity(v);
                        setRegBarangay("");
                      }}
                    />
                    <SelectField
                      label="Barangay"
                      placeholder={regCity ? "Select a Barangay..." : "Select a City first"}
                      icon={<MapPin className="w-4 h-4" />}
                      value={regBarangay}
                      options={availableBarangays}
                      disabled={!regCity}
                      onChange={setRegBarangay}
                    />
                    <Field
                      label="Street / House / Building No."
                      placeholder="e.g. Block 12 Lot 5, Rizal Street or Purok 7"
                      icon={<MapPin className="w-4 h-4" />}
                      value={regStreetAddress}
                      onChange={setRegStreetAddress}
                    />
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex gap-2">
                      <Info className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-800 font-semibold">
                        No Region required. Leaderboards are based on Barangay level only; the street address above is used for delivery of redeemed items.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setRegError("");
                        if (!regProvince || !regCity || !regBarangay) {
                          setRegError("Please select Province, City/Municipality, and Barangay");
                          return;
                        }
                        setRegStep(2);
                      }}
                      className="w-full py-4 rounded-2xl bg-primary text-white font-black"
                    >
                      Continue
                    </button>
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
                    <button
                      disabled={regLoading}
                      onClick={async () => {
                        setRegError("");
                        if (!regFullName || !regEmail || !regPassword) {
                          setRegError("Please fill in all fields from Step 1");
                          setRegStep(0);
                          return;
                        }
                        if (regPassword !== regConfirmPassword) {
                          setRegError("Passwords do not match");
                          setRegStep(0);
                          return;
                        }
                        if (!regProvince || !regCity || !regBarangay) {
                          setRegError("Please select Province, City, and Barangay in Step 2");
                          setRegStep(1);
                          return;
                        }
                        const names = regFullName.trim().split(/\s+/);
                        const firstName = names[0] || "User";
                        const lastName = names.slice(1).join(" ") || "Lastname";
                        try {
                          setRegLoading(true);
                          const regAuth = await Waste2GoodsAPI.register({
                            firstName,
                            lastName,
                            email: regEmail,
                            password: regPassword,
                            phone: regPhone,
                            province: regProvince,
                            city: regCity,
                            barangayName: regBarangay,
                            streetAddress: regStreetAddress,
                          });
                          if (regAuth?.user) setProfileUser({ ...regAuth.user });
                          setRegLoading(false);
                          setRegStep(0);
                          go("mfa");
                        } catch (e) {
                          setRegLoading(false);
                          setRegError(e instanceof Error ? e.message : "Registration failed");
                          setRegStep(0);
                        }
                      }}
                      className="w-full py-4 rounded-2xl bg-primary text-white font-black disabled:opacity-60"
                    >
                      {regLoading ? "Creating account..." : "Enable MFA & Continue"}
                    </button>
                    <button
                      disabled={regLoading}
                      onClick={async () => {
                        setRegError("");
                        if (!regFullName || !regEmail || !regPassword) {
                          setRegError("Please fill in all fields from Step 1");
                          setRegStep(0);
                          return;
                        }
                        if (regPassword !== regConfirmPassword) {
                          setRegError("Passwords do not match");
                          setRegStep(0);
                          return;
                        }
                        if (!regProvince || !regCity || !regBarangay) {
                          setRegError("Please select Province, City, and Barangay in Step 2");
                          setRegStep(1);
                          return;
                        }
                        const names = regFullName.trim().split(/\s+/);
                        const firstName = names[0] || "User";
                        const lastName = names.slice(1).join(" ") || "Lastname";
                        try {
                          setRegLoading(true);
                          const regAuth = await Waste2GoodsAPI.register({
                            firstName,
                            lastName,
                            email: regEmail,
                            password: regPassword,
                            phone: regPhone,
                            province: regProvince,
                            city: regCity,
                            barangayName: regBarangay,
                            streetAddress: regStreetAddress,
                          });
                          if (regAuth?.user) setProfileUser({ ...regAuth.user });
                          setRegLoading(false);
                          setRegStep(0);
                          go("profile-setup");
                        } catch (e) {
                          setRegLoading(false);
                          setRegError(e instanceof Error ? e.message : "Registration failed");
                          setRegStep(0);
                        }
                      }}
                      className="w-full text-center text-sm text-muted-foreground font-semibold disabled:opacity-60"
                    >
                      Skip for now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MFA ── */}
          {screen === "mfa" && (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center px-8 gap-7 overflow-y-auto" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
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
            <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
              <div className="sticky top-0 z-10 px-6 py-4 border-b border-border bg-white" style={{ paddingTop: "calc(1rem + var(--sat))" }}>
                <h2 className="text-base font-black text-foreground">Set Up Your Profile</h2>
                <p className="text-xs text-muted-foreground">Almost there!</p>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-24">
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
                <Field label="Display Name" placeholder="Your display name" icon={<User className="w-4 h-4" />} defaultVal={currentUser.name && currentUser.name !== "Guest User" ? currentUser.name : ""} />
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
            <div className="h-full min-h-[100dvh] flex flex-col overflow-y-auto"
                 style={{ paddingTop: "calc(0.75rem + var(--sat))", paddingBottom: "calc(1.5rem + var(--sab))" }}>
              <div className="flex flex-col items-center gap-2 px-8 pt-4 pb-3 shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Recycle className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl font-black text-foreground">Welcome back!</h2>
                <p className="text-muted-foreground text-sm text-center">Sign in to your Waste2Goods account</p>
              </div>
              <div className="px-6 flex flex-1 flex-col w-full max-w-xl mx-auto space-y-3">
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
                <p className="text-right text-xs text-primary font-bold cursor-pointer shrink-0">Forgot Password?</p>
                {loginError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <span>{loginError}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setShowLoginServer(v => !v); setLoginServerBanner(null); setApiHostState(getApiHost()); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-bold text-foreground shrink-0"
                >
                  <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Server IP Settings</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showLoginServer ? "rotate-90" : ""}`} />
                </button>
                {showLoginServer && (
                  <div className="space-y-2 shrink-0">
                    {loginServerBanner && (
                      <div className={`rounded-xl px-3 py-2 text-xs font-bold ${loginServerBanner.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>{loginServerBanner.text}</div>
                    )}
                    <ServerIpPanel
                      apiHost={apiHost}
                      setApiHostState={setApiHostState}
                      onSaved={setLoginServerBanner}
                      compact
                    />
                  </div>
                )}
                <div className="mt-auto space-y-3 pt-3 shrink-0">
                  <button
                    disabled={loginLoading}
                    onClick={async () => {
                      setLoginError("");
                      setLoginLoading(true);
                      try {
                        const authResult = await Waste2GoodsAPI.login(email, password);
                        if (authResult?.user) setProfileUser({ ...authResult.user });
                        go("home");
                      } catch (e) {
                        setLoginError(e instanceof Error ? e.message : "Invalid credentials. Please check your email and password.");
                      } finally {
                        setLoginLoading(false);
                      }
                    }}
                    className="w-full py-4 rounded-2xl bg-primary text-white font-black text-base hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loginLoading ? "Signing in..." : "Sign In"}
                  </button>
                  <div className="flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="flex-1 h-px bg-border" /></div>
                  <button className="w-full py-3 rounded-2xl border border-border text-sm font-semibold text-foreground flex items-center justify-center gap-2 hover:bg-secondary transition-colors">
                    🇵🇭 Continue with Barangay ID
                  </button>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground pt-5 shrink-0">New resident? <button onClick={() => go("register")} className="text-primary font-bold">Create account</button></p>
            </div>
          )}

          {/* ── HOME ── */}
          {screen === "home" && (
            <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
              <div className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Good morning,</p>
                  <h2 className="text-xl font-black text-foreground">{(currentUser.name && currentUser.name.trim() !== "") ? `${currentUser.name.split(" ")[0]} 👋` : "👋"}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => go("notifications")} className="relative p-2 rounded-xl border border-border bg-white hover:bg-secondary transition-colors">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    {notifUnread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white">{notifUnread <= 9 ? notifUnread : "9+"}</span>
                    )}
                  </button>
                  <button onClick={() => go("profile")} className="w-9 h-9 rounded-full bg-primary text-white font-black text-sm flex items-center justify-center">{currentUser.initials}</button>
                </div>
              </div>

              {/* Scrollable content — everything scrolls together so user never misses content on short screens */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-5 pt-4 pb-24 space-y-4">
                  {/* Points hero */}
                  <div className="rounded-3xl p-5 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #15803d, #0ea5e9)" }}>
                    <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #16a34a, transparent)" }} />
                    <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/5" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold opacity-75 uppercase tracking-wide">Your Balance</span>
                        <Leaf className="w-4 h-4 opacity-60" />
                      </div>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-5xl font-black tracking-tight">{currentUser.points.toLocaleString()}</span>
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

                  <KioskLinkBadge connected={kioskSession.connected} kioskId={kioskSession.kioskId} checking={kioskChecking} connectedAt={kioskSession.connectedAt} onDisconnect={handleDisconnectKiosk} />

                  {/* Quick actions */}
                  <div className="grid grid-cols-3 gap-2.5">
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
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-black text-foreground">Community Leaderboard</h3>
                      <div className="flex rounded-xl overflow-hidden border border-border text-xs">
                        {(["weekly","monthly"] as const).map(t => (
                          <button key={t} onClick={() => setLeaderTab(t)} className={`px-3 py-1.5 font-bold capitalize transition-colors ${leaderTab === t ? "bg-primary text-white" : "bg-white text-muted-foreground"}`}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {mergedLeaderboard.map(u => (
                        <div key={`${u.rank}-${u.userId || u.name}`} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${u.isMe ? "border-primary/30 bg-green-50" : "border-border bg-white"}`}>
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
                </div>
              </div>
              <MobileBottomNav screen={screen} go={go} />
            </div>
          )}

          {/* ── SUBMIT: Entry ── */}
          {screen === "submit" && (
            <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
              <div className="sticky top-0 z-10 px-5 pb-3 pt-3 flex items-center gap-3 border-b border-border bg-background" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
                <button onClick={() => go("home")}><ArrowLeft className="w-5 h-5" /></button>
                <h2 className="text-base font-black">Submit Recyclables</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-24">
                <KioskLinkBadge connected={kioskSession.connected} kioskId={kioskSession.kioskId} checking={kioskChecking} connectedAt={kioskSession.connectedAt} onDisconnect={handleDisconnectKiosk} />
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
                  <h3 className="text-sm font-black mb-1">Nearby Kiosks</h3>
                  <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
                    Each kiosk shows its <strong>total submissions TODAY</strong> (how many residents already dropped off PET plastic at that location today).
                  </p>
                  {kiosks.filter(k => k.status === "online").slice(0,3).map(k => (
                    <div key={k.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-foreground">{k.id}</p>
                        <p className="text-xs text-muted-foreground">{k.location}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-xs text-primary font-black">{k.submissions} today</span>
                        <span className="text-[10px] text-muted-foreground">submissions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <MobileBottomNav screen={screen} go={go} />
            </div>
          )}

          {/* ── SUBMIT: Scanning ── */}
          {screen === "submit-scan" && (
            <div className="min-h-[100dvh] flex flex-col" style={{ background: "#000" }}>
              <div className="px-5 pb-4 flex items-center justify-between shrink-0" style={{ paddingTop: "calc(1rem + var(--sat))" }}>
                <button onClick={() => go("submit")}><ArrowLeft className="w-5 h-5 text-white" /></button>
                <p className="text-white font-black text-sm">Scanning...</p>
                <div />
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-8 relative overflow-hidden">
                <div id="qr-reader" className="w-80 max-w-[85vw] aspect-square rounded-xl overflow-hidden" />
                <p className="text-white/70 text-sm text-center px-8">Point your camera at the QR code on the Waste2Goods kiosk</p>
              </div>
            </div>
          )}

          {/* ── SUBMIT: Confirm/Weighing ── */}
          {screen === "submit-confirm" && (
            <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
              <div className="sticky top-0 z-10 px-5 pb-3 pt-3 flex items-center gap-3 border-b border-border bg-background" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
                <button onClick={() => go("submit")}><ArrowLeft className="w-5 h-5" /></button>
                <div>
                  <h2 className="text-base font-black">Confirm Submission</h2>
                  <p className="text-xs text-muted-foreground">K-01 · Bagong Pag-asa Hall</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-24">
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
            <div className="min-h-[100dvh] flex flex-col items-center justify-center p-8 gap-6 overflow-y-auto" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center">
                  <Check className="w-16 h-16 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 text-3xl animate-bounce">🎉</div>
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black text-foreground">Awesome{ (currentUser.name && currentUser.name.trim() !== "") ? `, ${currentUser.name.split(" ")[0]}` : "" }!</h2>
                <p className="text-muted-foreground text-sm mt-1">Submission recorded successfully</p>
              </div>
              <div className="w-full rounded-2xl bg-white border border-border p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Previous balance</span><span className="font-bold">{Math.max(0, currentUser.points).toLocaleString()} pts</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Points earned</span><span className="font-bold text-primary">+{Math.round(weight * 50)} pts</span></div>
                <div className="h-px bg-border" />
                <div className="flex justify-between"><span className="font-black text-base">New balance</span><span className="font-black text-primary text-base">{(Math.max(0, currentUser.points) + Math.round(weight * 50)).toLocaleString()} pts</span></div>
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
            <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
              <div className="sticky top-0 z-10 px-5 pb-3 pt-3 border-b border-border bg-background" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black">Rewards Catalog</h2>
                  <button onClick={() => go("redeem-history")} className="text-xs text-primary font-bold flex items-center gap-1"><Clock className="w-3 h-3" />History</button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Balance: <span className="font-black text-primary">{currentUser.points.toLocaleString()} pts</span></p>
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
                        <button onClick={() => { setSelectedReward(r); go("redeem-confirm"); }} className={`text-xs px-2.5 py-1.5 rounded-xl font-bold transition-colors ${r.points <= currentUser.points ? "bg-primary text-white hover:bg-green-700" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                          {r.points <= currentUser.points ? "Redeem" : "Need more"}
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
            <RedeemConfirmScreen
              reward={selectedReward}
              currentUser={currentUser}
              onCancel={() => { setSelectedReward(null); go("rewards"); }}
              onBack={() => go("rewards")}
            />
          )}

          {/* ── REDEEM HISTORY ── */}
          {screen === "redeem-history" && (
            <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
              <div className="sticky top-0 z-10 px-5 pb-3 pt-3 flex items-center gap-3 border-b border-border bg-background" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
                <button onClick={() => go("rewards")}><ArrowLeft className="w-5 h-5" /></button>
                <h2 className="text-base font-black">Redemption History</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3 pb-24">
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
            <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
              <div className="sticky top-0 z-10 px-5 pb-3 pt-3 border-b border-border bg-background" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
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
            <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
              <div className="flex-1 overflow-y-auto">
                <div className="pb-24">
                  <div className="px-5 pt-5 pb-6 flex flex-col items-center gap-3" style={{ paddingTop: "calc(1.5rem + var(--sat))", background: "linear-gradient(160deg, #052e16, #15803d)" }}>
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-3 border-white/30 bg-white/10 flex items-center justify-center text-2xl font-black text-white">{currentUser.initials}</div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-green-900 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>
                    </div>
                    <div className="text-center">
                      <h2 className="text-lg font-black text-white">{currentUser.name}</h2>
                      <p className="text-xs text-green-300 flex items-center gap-1 justify-center"><MapPin className="w-3 h-3" />{currentUser.barangay} · {profileSinceLabel}</p>
                      {currentUser.id && (
                        <p className="text-[10px] text-green-400/80 mt-0.5 font-mono">{currentUser.id}{currentUser.email ? ` · ${currentUser.email}` : ""}</p>
                      )}
                    </div>
                    <div className="flex gap-6 mt-1 bg-white/10 rounded-2xl px-6 py-3 border border-white/10">
                      {[
                        [currentUser.points.toLocaleString(), "Points"],
                        [String(currentUser.submissions), "Submissions"],
                        [profileRank, "Weekly Rank"],
                      ].map(([v, l]) => (
                        <div key={l as string} className="text-center">
                          <p className="text-base font-black text-white">{v}</p>
                          <p className="text-xs text-green-300">{l}</p>
                        </div>
                      ))}
                    </div>
                    <div className="w-full mt-1">
                      <KioskLinkBadge connected={kioskSession.connected} kioskId={kioskSession.kioskId} checking={kioskChecking} connectedAt={kioskSession.connectedAt} onDisconnect={handleDisconnectKiosk} />
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    {[
                      { icon: <Activity className="w-4 h-4" />, label: "Transaction History", action: () => go("history"), color: "bg-blue-100 text-blue-600", sub: `${currentUser.submissions + Number(currentUser.redeemed || 0)} activities` },
                      { icon: <ShoppingCart className="w-4 h-4" />, label: "Rewards Redeemed", action: () => go("redeem-history"), color: "bg-indigo-100 text-indigo-600", sub: `${currentUser.redeemed || 0} items` },
                      { icon: <Settings className="w-4 h-4" />, label: "Account Settings", action: () => go("settings"), color: "bg-purple-100 text-purple-600", sub: "Name, email, barangay, phone" },
                      { icon: <Shield className="w-4 h-4" />, label: "Security & MFA", action: () => {}, color: "bg-green-100 text-green-700" },
                      { icon: <Bell className="w-4 h-4" />, label: "Notifications", action: () => go("notifications"), color: "bg-amber-100 text-amber-600", sub: `${notifItems.length} total${notifUnread > 0 ? ` · ${notifUnread} unread` : ""}` },
                      { icon: <Globe className="w-4 h-4" />, label: "Language & Region", action: () => {}, color: "bg-cyan-100 text-cyan-600" },
                      { icon: <HelpCircle className="w-4 h-4" />, label: "Help & FAQ", action: () => {}, color: "bg-slate-100 text-slate-600" },
                      { icon: <LogOut className="w-4 h-4 text-red-600" />, label: "Sign Out", action: () => { Waste2GoodsAPI.logout(); go("login"); }, color: "bg-red-100 text-red-600" },
                    ].map(item => (
                      <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-border hover:bg-secondary transition-colors">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.color}`}>{item.icon}</div>
                        <div className="flex-1 min-w-0 text-left">
                          <span className="text-sm font-bold text-foreground block">{item.label}</span>
                          {item.sub && <span className="text-[10px] text-muted-foreground">{item.sub}</span>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <MobileBottomNav screen={screen} go={go} />
            </div>
          )}

          {/* ── HISTORY ── */}
          {screen === "history" && (
            <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
              <div className="sticky top-0 z-10 px-5 pb-3 pt-3 flex items-center gap-3 border-b border-border bg-background" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
                <button onClick={() => go("profile")}><ArrowLeft className="w-5 h-5" /></button>
                <h2 className="text-base font-black">Transaction History</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3 pb-24">
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
            <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
              <div className="sticky top-0 z-10 px-5 pb-3 pt-3 flex items-center gap-3 border-b border-border bg-background" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
                <button onClick={() => go("profile")}><ArrowLeft className="w-5 h-5" /></button>
                <h2 className="text-base font-black">Account Settings</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-24">
                {profileBanner && (
                  <div className={`rounded-xl px-3 py-2 text-xs font-bold ${profileBanner.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>{profileBanner.text}</div>
                )}
                <ServerIpPanel
                  apiHost={apiHost}
                  setApiHostState={setApiHostState}
                  onSaved={setProfileBanner}
                />
                {[
                  { l: "First Name", val: setFName, setter: setSetFName, placeholder: "Juan" },
                  { l: "Last Name", val: setLName, setter: setSetLName, placeholder: "Reyes" },
                  { l: "Email", val: setFormEmail, setter: setSetFormEmail, placeholder: "juan@email.com", inputType: "email" },
                  { l: "Phone", val: setPhone, setter: setSetPhone, placeholder: "+63 9xx xxx xxxx", inputType: "tel" },
                  { l: "Barangay", val: setBrgy, setter: setSetBrgy, placeholder: "Cabantian" },
                  { l: "City", val: setCity, setter: setSetCity, placeholder: "Davao City" },
                  { l: "Province", val: setProvince, setter: setSetProvince, placeholder: "Davao del Sur" },
                ].map(f => (
                  <div key={f.l}>
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">{f.l}</label>
                    <input
                      type={(f as any).inputType || "text"}
                      value={f.val}
                      onChange={e => f.setter(e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                ))}
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-black mt-4 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
                >{profileSaving ? "Saving…" : "Save Changes"}</button>
                {currentUser.id && (
                  <p className="text-[10px] text-center text-muted-foreground font-mono pt-2">User ID: {currentUser.id}</p>
                )}
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS (mobile bell 🔔) ── */}
          {screen === "notifications" && (() => {
            // Time formatter helper (relative: "5m ago", "3h ago", "Mar 12")
            const timeAgo = (t: string) => {
              try {
                const ms = new Date(t).getTime();
                if (!ms) return "";
                const diff = Date.now() - ms;
                const mins = Math.floor(diff / 60000);
                if (mins < 1) return "Just now";
                if (mins < 60) return `${mins}m ago`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24) return `${hrs}h ago`;
                const days = Math.floor(hrs / 24);
                if (days < 7) return `${days}d ago`;
                return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              } catch { return ""; }
            };
            // Icon by notification type
            const notifIcon = (type: string, severity: string) => {
              if (type === "redemption") return <Gift className={`w-4 h-4 ${severity === "danger" ? "text-red-600" : "text-indigo-600"}`} />;
              if (type === "milestone") return <Trophy className="w-4 h-4 text-amber-600" />;
              if (type === "task") return <Target className="w-4 h-4 text-primary" />;
              if (type === "welcome") return <Leaf className="w-4 h-4 text-green-600" />;
              if (type === "submission") return <Recycle className="w-4 h-4 text-green-700" />;
              return <Bell className="w-4 h-4 text-muted-foreground" />;
            };
            const notifIconBg = (type: string) => {
              if (type === "redemption") return "bg-indigo-100";
              if (type === "milestone") return "bg-amber-100";
              if (type === "task") return "bg-green-100";
              if (type === "welcome") return "bg-emerald-100";
              if (type === "submission") return "bg-lime-100";
              return "bg-slate-100";
            };
            return (
              <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
                <div className="sticky top-0 z-10 px-5 pb-3 pt-3 flex items-center gap-3 border-b border-border bg-background" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
                  <button onClick={() => go("home")}><ArrowLeft className="w-5 h-5" /></button>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-black leading-tight">Notifications</h2>
                    <p className="text-[10px] text-muted-foreground">{notifItems.length} total{notifUnread > 0 ? ` · ${notifUnread} unread` : " · All read ✓"}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    LIVE · {currentUser.id || "U-000"}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-2 pb-24">
                  {notifItems.length === 0 && (
                    <div className="py-16 flex flex-col items-center gap-3 text-center px-5">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Bell className="w-7 h-7 text-slate-400" />
                      </div>
                      <h3 className="font-black text-foreground">No notifications yet</h3>
                      <p className="text-xs text-muted-foreground">When you submit waste, redeem rewards, or unlock badges — you'll see them here.</p>
                      <button onClick={() => go("home")} className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black">Return to Home</button>
                    </div>
                  )}
                  {notifItems.map(n => (
                    <div key={n.id} className={`flex gap-3 p-3.5 rounded-2xl border ${n.read === false ? "bg-primary/5 border-primary/20" : "bg-white border-border"}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${notifIconBg(n.type)}`}>
                        {notifIcon(n.type, n.severity || "info")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-bold text-foreground leading-snug ${n.read === false ? "" : "opacity-90"}`}>{n.title}</p>
                          <span className="flex-shrink-0 text-[10px] text-muted-foreground font-semibold whitespace-nowrap">{timeAgo(n.time)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                        {n.read === false && <span className="inline-block mt-1.5 w-1.5 h-1.5 rounded-full bg-primary" title="Unread" />}
                      </div>
                    </div>
                  ))}
                </div>
                <MobileBottomNav screen={screen} go={go} />
              </div>
            );
          })()}
      </div>
    </div>
  );
}
