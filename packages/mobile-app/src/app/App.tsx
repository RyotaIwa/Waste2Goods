
import { useState, useEffect, useRef, useMemo } from "react";
import { Waste2GoodsAPI, getApiHost, setApiHost, getApiBaseUrl, testApiConnection } from "@waste2goods/core";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  Monitor, Recycle, Home, QrCode, Gift,
  Target, User, ArrowLeft, AlertCircle, CheckCircle2,
  RefreshCw, MapPin,
  Trophy, Medal, Zap,
  Bell, LogOut,
  ChevronRight, Shield, Mail, Phone, Leaf,
  Settings, Lock, Info, Flame, Camera, Globe,
  ScanLine, Keyboard, Hash, Sparkles, Award, Upload, CheckSquare2, Cable, Wallet, X, Circle, Package,
  Copy, Check
} from "lucide-react";

type MobileScreen =
  | "splash" | "onboard1" | "onboard2" | "onboard3"
  | "login" | "register" | "mfa" | "profile-setup"
  | "home" | "submit" | "submit-scan" | "submit-confirm" | "submit-done"
  | "rewards" | "redeem-confirm" | "redeem-history"
  | "tasks" | "profile" | "history" | "settings" | "notifications"
  | "leaderboard";

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
  { id: 1, name: "School Supplies Kit", points: 500, cost: 500, category: "Education", stock: 23, icon: "📚", seasonal: false, description: "Complete school essentials set including notebooks, pens, and bag.", delivery: "Barangay Pick-up", validity: "30 Days" },
  { id: 2, name: "Grocery Voucher ₱100", points: 800, cost: 800, category: "Grocery", stock: 15, icon: "🛒", seasonal: false, description: "₱100 voucher redeemable at all participating local grocery stores.", delivery: "Digital Code", validity: "60 Days" },
  { id: 3, name: "Eco Water Bottle", points: 350, cost: 350, category: "Lifestyle", stock: 41, icon: "🍶", seasonal: false, description: "BPA-free stainless steel insulated 750ml eco water bottle.", delivery: "Barangay Pick-up", validity: "30 Days" },
  { id: 4, name: "Rice (5kg)", points: 1200, cost: 1200, category: "Grocery", stock: 8, icon: "🌾", seasonal: false, description: "5kg premium white rice bag for family consumption.", delivery: "Kiosk Pickup", validity: "14 Days" },
  { id: 5, name: "Plant Seedling Set", points: 250, cost: 250, category: "Garden", stock: 60, icon: "🌱", seasonal: true, description: "Assorted vegetable seedlings set for home gardening.", delivery: "Barangay Pick-up", validity: "14 Days" },
  { id: 6, name: "Reusable Bag Bundle", points: 180, cost: 180, category: "Lifestyle", stock: 88, icon: "👜", seasonal: false, description: "3x heavy-duty canvas reusable shopping bags.", delivery: "Barangay Pick-up", validity: "60 Days" },
  { id: 7, name: "Back-to-School Bundle", points: 650, cost: 650, category: "Education", stock: 12, icon: "🎒", seasonal: true, description: "Backpack, water flask, and basic stationery kit.", delivery: "Barangay Pick-up", validity: "30 Days" },
  { id: 8, name: "Herbal Tea Set", points: 300, cost: 300, category: "Wellness", stock: 35, icon: "🍵", seasonal: true, description: "Organic herbal tea selection with bamboo strainer.", delivery: "Barangay Pick-up", validity: "30 Days" },
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

const STYLE_WEEKLY_DATA = [
  { day: "Mon", kg: 42 }, { day: "Tue", kg: 67 }, { day: "Wed", kg: 53 },
  { day: "Thu", kg: 89 }, { day: "Fri", kg: 74 }, { day: "Sat", kg: 112 }, { day: "Sun", kg: 95 }
];
const BADGE_SUCCESS_CLS = "bg-green-100 text-green-700";
const BADGE_WARN_CLS = "bg-amber-100 text-amber-700";
const BADGE_DANGER_BG = "bg-red-50 border border-red-200 text-red-700";
const BADGE_OK_BG = "bg-green-50 border border-green-200 text-green-700";
const INPUT_BASE_CLS = "w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
const BTN_PRIMARY_CLS = "rounded-2xl bg-primary text-white font-black hover:bg-green-700 transition-colors";
const BTN_SECONDARY_CLS = "rounded-2xl border border-border font-bold text-foreground hover:bg-secondary transition-colors";

function RankIcon({ rank }: Readonly<{ rank: number }>) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-500" />;
  return <span className="text-xs text-muted-foreground font-mono font-bold">#{rank}</span>;
}

function StatusPip({ status }: Readonly<{ status: string }>) {
  const c: Record<string, string> = { online: "bg-emerald-400", offline: "bg-red-400", maintenance: "bg-amber-400", active: "bg-emerald-400", inactive: "bg-gray-300" };
  return <span className={`inline-block w-3 h-3 rounded-full ${c[status] ?? "bg-gray-300"}`} />;
}

function SignalIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <rect x="0" y="9" width="3" height="7" rx="1" /><rect x="4.5" y="6" width="3" height="10" rx="1" />
      <rect x="9" y="3" width="3" height="13" rx="1" /><rect x="13.5" y="0" width="3" height="16" rx="1" />
    </svg>
  );
}

function AnimatedNumber({ value, suffix = "", className = "" }: Readonly<{ value: number; suffix?: string; className?: string }>) {
  return <span className={className}>{value}{suffix}</span>;
}

function elapsedFromTs(ts?: number | string | null): string {
  if (!ts) return "";
  const diffSec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

function useAnimatedWeight(target: number, running: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!running) return;
    const step = target / 40;
    let cur = 0;
    const iv = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(Number.parseFloat(cur.toFixed(2)));
      if (cur >= target) clearInterval(iv);
    }, 60);
    return () => clearInterval(iv);
  }, [running, target]);
  return val;
}

function Field({
  label,
  placeholder,
  type = "text",
  icon,
  value,
  onChange,
  defaultValue,
  defaultVal,
  containerClassName,
  inputClassName,
  id,
}: Readonly<{
  label: string;
  placeholder: string;
  type?: string;
  icon?: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  defaultVal?: string;
  containerClassName?: string;
  inputClassName?: string;
  id?: string;
}>) {
  const initialValue = value ?? defaultValue ?? defaultVal;
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, "-") : undefined);
  return (
    <div className={containerClassName}>
      {label ? <label htmlFor={inputId} className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">{label}</label> : null}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">{icon}</div>}
        <input
          id={inputId}
          type={type}
          value={initialValue}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${inputClassName ?? ""}`}
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
}: Readonly<{
  label: string;
  placeholder: string;
  icon?: React.ReactNode;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}>) {
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

function patchAuthBalance(newBalance: number) {
  const AUTH_STORAGE_KEY = "w2g_auth_state";
  try {
    const auth = Waste2GoodsAPI.getAuthState();
    if (auth?.user) {
      const patchedUser = { ...auth.user, points: Number(newBalance), pointsBalance: Number(newBalance) };
      const patchedAuth = { ...auth, user: patchedUser, isAuthenticated: true };
      try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(patchedAuth)); } catch {}
    }
  } catch {}
}

function getRedeemButtonLabel(loading: boolean, success: any): string {
  if (loading) return "Processing...";
  if (success) return "✅ Done — back to Rewards Catalog";
  return "Confirm Redemption";
}



function saveServerIp(apiHost: string, onSaved?: (msg: { type: "ok" | "err"; text: string }) => void): string | null {
  const trimmed = apiHost.trim();
  if (!trimmed) {
    onSaved?.({ type: "err", text: "Please enter an IP address or hostname" });
    return null;
  }
  setApiHost(trimmed);
  const cleanHost = getApiHost();
  const url = getApiBaseUrl().replace(/\/api$/, "");
  onSaved?.({ type: "ok", text: `✅ Server saved: ${url} — setting saved on device.` });
  return cleanHost;
}

async function testServerIp(apiHost: string, setTesting: (v: boolean) => void, onSaved?: (msg: { type: "ok" | "err"; text: string }) => void): Promise<void> {
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
}

function resetServerIp(setApiHostState: (v: string) => void, onSaved?: (msg: { type: "ok" | "err"; text: string }) => void): void {
  setApiHostState("192.168.1.164");
  setApiHost("192.168.1.164");
  onSaved?.({ type: "ok", text: "Default set to 192.168.1.164:3001" });
}

function ServerIpPanel({
  apiHost,
  setApiHostState,
  onSaved,
  compact,
}: Readonly<{
  apiHost: string;
  setApiHostState: (v: string) => void;
  onSaved?: (msg: { type: "ok" | "err"; text: string }) => void;
  compact?: boolean;
}>) {
  const [testing, setTesting] = useState(false);
  const save = () => {
    saveServerIp(apiHost, onSaved);
  };
  const test = async () => {
    await testServerIp(apiHost, setTesting, onSaved);
  };
  const resetToDefault = () => {
    resetServerIp(setApiHostState, onSaved);
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
        <label htmlFor="server-ip-addr-input" className="text-[11px] font-black text-muted-foreground uppercase tracking-wide mb-1 block">PC IP Address</label>
        <input
          id="server-ip-addr-input"
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

function renderKioskBadgeBody(checking?: boolean, connected?: boolean, kioskId?: string, elapsedLabel?: string) {
  if (checking && !connected) {
    return <span className="truncate">Checking kiosk link…</span>;
  }
  if (connected) {
    return (
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
    );
  }
  return <span className="truncate">No kiosk linked — scan the kiosk QR via Submit tab</span>;
}

function KioskLinkBadge({
  connected,
  kioskId,
  checking,
  connectedAt,
  onDisconnect,
}: Readonly<{
  connected: boolean;
  kioskId?: string;
  checking?: boolean;
  connectedAt?: number;
  onDisconnect?: () => void;
}>) {
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
        {renderKioskBadgeBody(checking, connected, kioskId, elapsedLabel)}
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
            >
              Disconnect
            </button>
          )}
        </>
      )}
    </div>
  );
}

type MobileUserShape = {
  id: string; userId: string; name: string; initials: string; email: string; phone: string;
  barangay: string; barangayName: string; province: string; city: string; streetAddress: string;
  points: number; submissions: number; redeemed: number; joined: string; createdAt: any;
  firstName: string; lastName: string; totalKg: number;
};

function initialsFromName(name: string, fallback: string) {
  return (name || fallback)
    .split(/\s+/)
    .filter(Boolean)
    .map((p: string) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function buildCurrentUser(profileUser: any): MobileUserShape {
  const userObj = profileUser || Waste2GoodsAPI.getAuthState()?.user || null;
  if (userObj) {
    const rawName = (userObj.name || `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim()) as string;
    const fallbackFromFlds = `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim();
    const id = (userObj as any).id || (userObj as any).userId || "";
    const name = rawName || fallbackFromFlds || (id ? "" : "Guest User");
    const init = initialsFromName(name || `${userObj.firstName || ""} ${userObj.lastName || ""}`, id ? "U" : "GU");
    const points = (userObj as any).points ?? (userObj as any).pointsBalance ?? 0;
    return {
      id,
      userId: id,
      name,
      initials: init || (id ? "U" : "GU"),
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
      totalKg: Number((userObj as any).totalKg || 0),
    };
  }
  return {
    id: "", userId: "", name: "", initials: "", email: "", phone: "",
    barangay: "Cabantian", barangayName: "Cabantian", province: "Davao del Sur", city: "Davao City",
    streetAddress: "", points: 0, submissions: 0, redeemed: 0, joined: "", createdAt: null,
    firstName: "", lastName: "", totalKg: 0,
  };
}

function currentUserIdForLeaderboard() {
  try {
    const auth = Waste2GoodsAPI.getAuthState()?.user || null;
    const u = buildCurrentUser(auth);
    return String(auth?.id || auth?.userId || u.id || u.userId || "").toUpperCase();
  } catch {
    return "";
  }
}

function buildMergedLeaderboard(liveLeaderboard: any[] | null, currentUser: MobileUserShape) {
  const myId = currentUserIdForLeaderboard() || String(currentUser.id || currentUser.userId || "").toUpperCase();
  const myEmail = String(currentUser.email || "").toLowerCase();
  const myName = currentUser.name || "You";

  let list = (liveLeaderboard && liveLeaderboard.length > 0)
    ? liveLeaderboard.map((u: any, i: number) => {
        const firstName = u.firstName || "";
        const lastName = u.lastName || "";
        const name = (u.name && u.name.trim() !== "") ? u.name : [firstName, lastName].filter(Boolean).join(" ").trim() || u.userId || "Resident";
        const pts = Number(u.points ?? u.pointsBalance ?? 0);
        const subs = Number(u.submissions ?? u.totalSubmissions ?? 0);
        const uid = String(u.userId ?? u.id ?? "").toUpperCase();
        const uEmail = String(u.email || "").toLowerCase();
        const isMe = (!!myId && !!uid && uid === myId) || (!!myEmail && !!uEmail && uEmail === myEmail) || (name.toLowerCase() === myName.toLowerCase());
        const avatarChars = initialsFromName(name, "RU");
        return {
          id: uid || `u-${i}`,
          userId: uid,
          name,
          displayName: name,
          _initials: avatarChars || "RU",
          avatar: avatarChars || "RU",
          barangay: u.barangay || u.barangayName || currentUser.barangay || "Cabantian",
          points: pts,
          submissions: subs,
          totalKg: Number(u.totalKg || (subs * 2.3)),
          streak: Number(u.streak) || (subs > 0 ? Math.min(30, Math.max(1, Math.ceil(subs / 2))) : 1),
          isMe,
          _isYou: isMe,
        };
      })
    : DEMO_LEADERBOARD_FALLBACK.map((u, i) => {
        const isMe = (u.name.toLowerCase() === myName.toLowerCase()) || (u.id === currentUser.id);
        return {
          id: u.id || `demo-${i}`,
          userId: u.id || `demo-${i}`,
          name: u.name,
          displayName: u.name,
          _initials: u.avatar || "RU",
          avatar: u.avatar || "RU",
          barangay: u.barangay || "Cabantian",
          points: u.points,
          submissions: 10,
          totalKg: 23.0,
          streak: u.streak || 5,
          isMe,
          _isYou: isMe,
        };
      });

  // Ensure logged-in user is present in leaderboard
  const hasMe = list.some(u => u.isMe);
  if (!hasMe && currentUser.name && currentUser.name !== "Guest User") {
    const userInitials = currentUser.initials || initialsFromName(currentUser.name, "RU");
    list.push({
      id: currentUser.id || "my-user",
      userId: currentUser.id || "my-user",
      name: currentUser.name,
      displayName: currentUser.name,
      _initials: userInitials,
      avatar: userInitials,
      barangay: currentUser.barangay || "Cabantian",
      points: Number(currentUser.points || 0),
      submissions: Number(currentUser.submissions || 0),
      totalKg: Number(currentUser.totalKg || 0),
      streak: 7,
      isMe: true,
      _isYou: true,
    });
  }

  // Sort by points descending and calculate ranks
  list.sort((a, b) => b.points - a.points);
  return list.map((u, idx) => ({ ...u, rank: idx + 1 }));
}

function MobileBottomNav({ screen, go }: Readonly<{ screen: MobileScreen; go: (s: MobileScreen) => void }>) {
  const items = [
    { icon: <Home className="w-5 h-5" />, label: "Home", s: "home" as MobileScreen },
    { icon: <QrCode className="w-5 h-5" />, label: "Submit", s: "submit" as MobileScreen },
    { icon: <Gift className="w-5 h-5" />, label: "Rewards", s: "rewards" as MobileScreen },
    { icon: <Target className="w-5 h-5" />, label: "Tasks", s: "tasks" as MobileScreen },
    { icon: <User className="w-5 h-5" />, label: "Profile", s: "profile" as MobileScreen },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-3 pt-3 flex justify-around z-20" style={{ paddingBottom: "calc(0.75rem + var(--sab))" }}>
      {items.map(i => (
        <button type="button" key={i.label} onClick={() => go(i.s)} className={`flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl transition-colors ${screen === i.s || (i.s === "submit" && ["submit","submit-scan","submit-confirm","submit-done"].includes(screen)) ? "text-primary" : "text-muted-foreground"}`}>
          {i.icon}
          <span className="text-xs font-bold">{i.label}</span>
        </button>
      ))}
    </div>
  );
}

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

const ALPHABETICAL_COLLATOR = new Intl.Collator("en", {
  sensitivity: "base",
  caseFirst: "false",
  numeric: true,
});
const alphabeticalCompare = (a: string, b: string) => ALPHABETICAL_COLLATOR.compare(a, b);
const PROVINCES = Object.keys(PH_LOCATIONS).sort(alphabeticalCompare);

const UNPROTECTED_SCREENS = new Set<MobileScreen>([
  "splash", "onboard1", "onboard2", "onboard3",
  "login", "register", "mfa", "profile-setup",
]);

function isAuthRequiredScreen(screen: MobileScreen) {
  return !UNPROTECTED_SCREENS.has(screen);
}

function isSessionValid() {
  const auth = Waste2GoodsAPI.getAuthState();
  return Boolean(auth?.isAuthenticated && auth?.token);
}

function formatNotifTimeAgo(t: string) {
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
  } catch {
    return "";
  }
}

function notifIconForType(type: string, severity: string) {
  if (type === "redemption") return <Gift className={`w-4 h-4 ${severity === "danger" ? "text-red-600" : "text-indigo-600"}`} />;
  if (type === "milestone") return <Trophy className="w-4 h-4 text-amber-600" />;
  if (type === "task") return <Target className="w-4 h-4 text-primary" />;
  if (type === "welcome") return <Leaf className="w-4 h-4 text-green-600" />;
  if (type === "submission") return <Recycle className="w-4 h-4 text-green-700" />;
  return <Bell className="w-4 h-4 text-muted-foreground" />;
}

function notifIconBgClass(type: string) {
  if (type === "redemption") return "bg-indigo-100";
  if (type === "milestone") return "bg-amber-100";
  if (type === "task") return "bg-green-100";
  if (type === "welcome") return "bg-emerald-100";
  if (type === "submission") return "bg-lime-100";
  return "bg-slate-100";
}



type RegFormFields = {
  regFullName: string;
  regEmail: string;
  regPassword: string;
  regConfirmPassword: string;
  regProvince: string;
  regCity: string;
  regBarangay: string;
};

function validateRegStep0(fields: RegFormFields): string | null {
  if (!fields.regFullName || !fields.regEmail || !fields.regPassword || !fields.regConfirmPassword) {
    return "Please fill in all fields: name, email, phone, password, confirm password";
  }
  if (fields.regPassword !== fields.regConfirmPassword) return "Passwords do not match";
  if (fields.regPassword.length < 6) return "Password must be at least 6 characters";
  return null;
}

function validateRegStep1(fields: Pick<RegFormFields, "regProvince" | "regCity" | "regBarangay">): string | null {
  if (!fields.regProvince || !fields.regCity || !fields.regBarangay) {
    return "Please select Province, City/Municipality, and Barangay";
  }
  return null;
}

function validateRegComplete(fields: RegFormFields): { error: string | null; step?: number } {
  const step0 = validateRegStep0(fields);
  if (step0) return { error: step0, step: 0 };
  const step1 = validateRegStep1(fields);
  if (step1) return { error: step1, step: 1 };
  return { error: null };
}

function parseRegName(fullName: string) {
  const names = fullName.trim().split(/\s+/);
  return { firstName: names[0] || "User", lastName: names.slice(1).join(" ") || "Lastname" };
}

function buildProfilePatches(fields: {
  setFName: string; setLName: string; setFormEmail: string; setPhone: string;
  setProvince: string; setCity: string; setBrgy: string;
}) {
  const patches: Record<string, string> = {};
  if (fields.setFName) patches.firstName = fields.setFName;
  if (fields.setLName) patches.lastName = fields.setLName;
  if (fields.setFormEmail) patches.email = fields.setFormEmail;
  if (fields.setPhone) patches.phone = fields.setPhone;
  if (fields.setProvince) patches.province = fields.setProvince;
  if (fields.setCity) patches.city = fields.setCity;
  if (fields.setBrgy) patches.barangayName = fields.setBrgy;
  return patches;
}

async function persistProfile(
  currentUser: MobileUserShape,
  patches: Record<string, string>,
): Promise<boolean> {
  if (Waste2GoodsAPI.saveProfile) return Waste2GoodsAPI.saveProfile(patches);
  const userId = currentUser.id || currentUser.userId;
  const res = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Waste2GoodsAPI.getAuthState()?.token || ""}`,
    },
    body: JSON.stringify(patches),
  });
  return res.ok;
}

function publishQrBridge(decodedText: string, currentUser: MobileUserShape) {
  const auth = Waste2GoodsAPI.getAuthState();
  const u = auth?.user || {};
  const bridgePayload = {
    user: {
      id: (u as any).id || (u as any).userId || currentUser.id || "U-001",
      userId: (u as any).id || (u as any).userId || currentUser.id || "U-001",
      name: currentUser.name && currentUser.name !== "Guest User"
        ? currentUser.name
        : (u as any).name || `${(u as any).firstName || ""} ${(u as any).lastName || ""}`.trim() || "Registered User",
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
  try {
    window.dispatchEvent(new StorageEvent("storage", { key: "w2g_kiosk_qr_bridge", newValue: JSON.stringify(bridgePayload) }));
  } catch { /* ignore */ }
  Waste2GoodsAPI.connectKioskSession?.({
    userId: bridgePayload.user.id || bridgePayload.user.userId,
    userName: bridgePayload.user.name,
    kioskId: decodedText.includes("K-") ? decodedText : "K-01",
  });
}

function mapKioskSessionResponse(
  res: { connected?: boolean; kioskId?: string; connectedAt?: number } | null,
  prev: { connected: boolean; kioskId?: string; connectedAt?: number },
) {
  if (!res) return { connected: false } as const;
  return {
    connected: !!res.connected,
    kioskId: res.kioskId,
    connectedAt: res.connected ? (res.connectedAt ?? prev.connectedAt ?? Date.now()) : undefined,
  };
}

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

function validateRegisterStep1(v: { full: string; email: string; phone?: string; pwd: string; confirm: string }, setError: SetState<string>): boolean {
  setError("");
  if (!v.full || !v.email || !v.pwd || !v.confirm) {
    setError("Please fill in all fields: name, email, phone, password, confirm password");
    return false;
  }
  if (v.pwd !== v.confirm) {
    setError("Passwords do not match");
    return false;
  }
  if (v.pwd.length < 6) {
    setError("Password must be at least 6 characters");
    return false;
  }
  return true;
}

function validateRegisterAddress(v: { province: string; city: string; barangay: string }, setError: SetState<string>): boolean {
  setError("");
  if (!v.province || !v.city || !v.barangay) {
    setError("Please select Province, City/Municipality, and Barangay");
    return false;
  }
  return true;
}

function validateRegisterAll(v: { full: string; email: string; pwd: string; confirm: string; province: string; city: string; barangay: string }, setError: SetState<string>, goStep: (n: number) => void): boolean {
  setError("");
  if (!v.full || !v.email || !v.pwd) {
    setError("Please fill in all fields from Step 1");
    goStep(0);
    return false;
  }
  if (v.pwd !== v.confirm) {
    setError("Passwords do not match");
    goStep(0);
    return false;
  }
  if (!v.province || !v.city || !v.barangay) {
    setError("Please select Province, City, and Barangay in Step 2");
    goStep(1);
    return false;
  }
  return true;
}

function splitFullName(full: string): { firstName: string; lastName: string } {
  const names = full.trim().split(/\s+/);
  return { firstName: names[0] || "User", lastName: names.slice(1).join(" ") || "Lastname" };
}

function buildQrBridgePayload(authUser: any, currentUser: any, decodedText: string) {
  const u = authUser || {};
  const uid = u.id || u.userId || currentUser.id || "U-001";
  const rawName = currentUser.name && currentUser.name !== "Guest User"
    ? currentUser.name
    : (u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Registered User");
  const pts = currentUser.points || u.pointsBalance || 50;
  return {
    user: {
      id: uid,
      userId: uid,
      name: rawName,
      firstName: u.firstName,
      lastName: u.lastName,
      email: currentUser.email || u.email || "",
      points: pts,
      pointsBalance: pts,
    },
    kioskPayload: decodedText,
    timestamp: Date.now(),
  };
}

type RegisterSubmitCtx = Readonly<{
  full: string;
  email: string;
  pwd: string;
  confirm: string;
  phone: string;
  province: string;
  city: string;
  barangay: string;
  street: string;
}>;

async function doRegisterSubmit(
  ctx: RegisterSubmitCtx,
  setError: SetState<string>,
  setLoading: SetState<boolean>,
  setProfileUser: SetState<any>,
  setRegStep: SetState<number>,
  go: (s: MobileScreen) => void,
  targetAfter: MobileScreen,
): Promise<void> {
  const goStep = (n: number) => setRegStep(n);
  if (!validateRegisterAll(ctx, setError, goStep)) return;
  const names = splitFullName(ctx.full);
  try {
    setLoading(true);
    const regAuth = await Waste2GoodsAPI.register({
      firstName: names.firstName,
      lastName: names.lastName,
      email: ctx.email,
      password: ctx.pwd,
      phone: ctx.phone,
      province: ctx.province,
      city: ctx.city,
      barangayName: ctx.barangay,
      streetAddress: ctx.street,
    });
    if (regAuth?.user) setProfileUser({ ...regAuth.user });
    setLoading(false);
    setRegStep(0);
    go(targetAfter);
  } catch (e) {
    setLoading(false);
    setError(e instanceof Error ? e.message : "Registration failed");
    setRegStep(0);
  }
}

type MobileAppRouterProps = Readonly<{
  screen: MobileScreen;
  leaderTab: "weekly" | "monthly";
  regStep: number;
  selectedReward: typeof rewards[number] | null;
  rewardFilter: string;
  mfaCode: string[];
  weighing: boolean;
  email: string;
  password: string;
  loginError: string;
  loginLoading: boolean;
  regFullName: string;
  regEmail: string;
  regPassword: string;
  regConfirmPassword: string;
  regPhone: string;
  regProvince: string;
  regCity: string;
  regBarangay: string;
  regStreetAddress: string;
  regLoading: boolean;
  regError: string;
  profileUser: any;
  profileRank: string;
  profileSaving: boolean;
  profileBanner: { type: "ok" | "err"; text: string } | null;
  setFName: string;
  setLName: string;
  setFormEmail: string;
  setPhone: string;
  setBrgy: string;
  setCity: string;
  setProvince: string;
  notifItems: any[];
  notifUnread: number;
  kioskSession: { connected: boolean; kioskId?: string; connectedAt?: number };
  kioskChecking: boolean;
  apiHost: string;
  showLoginServer: boolean;
  loginServerBanner: { type: "ok" | "err"; text: string } | null;
  weight: any;
  mfaRefs: React.RefObject<(HTMLInputElement | null)[]>;
  availableCities: string[];
  availableBarangays: string[];
  currentUser: any;
  mergedLeaderboard: any[];
  profileSinceLabel: string;
  rewardCategories: string[];
  filteredRewards: typeof rewards;
  setSelectedReward: (r: typeof rewards[number] | null) => void;
  setRewardFilter: (v: string) => void;
  setMfaCode: (v: string[]) => void;
  setEmail: SetState<string>;
  setPassword: SetState<string>;
  setRegFullName: SetState<string>;
  setRegEmail: SetState<string>;
  setRegPassword: SetState<string>;
  setRegConfirmPassword: SetState<string>;
  setRegPhone: SetState<string>;
  setRegProvince: SetState<string>;
  setRegCity: SetState<string>;
  setRegBarangay: SetState<string>;
  setRegStreetAddress: SetState<string>;
  setRegError: SetState<string>;
  setRegStep: SetState<number>;
  setLeaderTab: SetState<"weekly" | "monthly">;
  setProfileBanner: SetState<{ type: "ok" | "err"; text: string } | null>;
  setSetFName: SetState<string>;
  setSetLName: SetState<string>;
  setSetFormEmail: SetState<string>;
  setSetPhone: SetState<string>;
  setSetBrgy: SetState<string>;
  setSetCity: SetState<string>;
  setSetProvince: SetState<string>;
  setLoginServerBanner: SetState<{ type: "ok" | "err"; text: string } | null>;
  setApiHostState: SetState<string>;
  handleSaveProfile: () => Promise<void>;
  handleDisconnectKiosk: () => Promise<void>;
  onLogin: () => Promise<void>;
  onRegisterStep1Next: () => void;
  onRegisterStep2Next: () => void;
  onRegisterStep3MFA: () => Promise<void>;
  onRegisterStep3Skip: () => Promise<void>;
  onToggleLoginServer: () => void;
  onRewardRedeem: () => Promise<void>;
  onRewardClose: () => void;
  onSubmitConfirm: () => void;
  go: (s: MobileScreen) => void;
}>;

function MobileScreens(p: MobileAppRouterProps) {
  const el = (
    <div className="relative flex flex-col w-full flex-1 min-h-0" style={{ background: "#f0fdf4" }}>
      <MobileScreenContent {...p} />
    </div>
  );
  return el;
}

function MobileScreenContent(p: MobileAppRouterProps) {
  const s = p.screen;
  switch (s) {
    case "splash": return <ScreenSplash />;
    case "onboard1": return <ScreenOnboard1 go={p.go} />;
    case "onboard2": return <ScreenOnboard2 go={p.go} />;
    case "onboard3": return <ScreenOnboard3 go={p.go} />;
    case "register":
      return (
        <ScreenRegister
          regStep={p.regStep}
          regFullName={p.regFullName} regEmail={p.regEmail} regPhone={p.regPhone}
          regPassword={p.regPassword} regConfirmPassword={p.regConfirmPassword}
          regProvince={p.regProvince} regCity={p.regCity} regBarangay={p.regBarangay}
          regStreetAddress={p.regStreetAddress}
          regError={p.regError} regLoading={p.regLoading}
          availableCities={p.availableCities} availableBarangays={p.availableBarangays}
          setRegFullName={p.setRegFullName} setRegEmail={p.setRegEmail} setRegPhone={p.setRegPhone}
          setRegPassword={p.setRegPassword} setRegConfirmPassword={p.setRegConfirmPassword}
          setRegProvince={p.setRegProvince} setRegCity={p.setRegCity} setRegBarangay={p.setRegBarangay}
          setRegStreetAddress={p.setRegStreetAddress} setRegError={p.setRegError}
          setRegStep={p.setRegStep} go={p.go}
          onStep1Next={p.onRegisterStep1Next} onStep2Next={p.onRegisterStep2Next}
          onStep3MFA={p.onRegisterStep3MFA} onStep3Skip={p.onRegisterStep3Skip}
        />
      );
    case "login":
      return (
        <ScreenLogin
          email={p.email} password={p.password} loginError={p.loginError} loginLoading={p.loginLoading}
          setEmail={p.setEmail} setPassword={p.setPassword}
          showLoginServer={p.showLoginServer} loginServerBanner={p.loginServerBanner}
          apiHost={p.apiHost} setApiHostState={p.setApiHostState}
          onToggleLoginServer={p.onToggleLoginServer} onLogin={p.onLogin}
          setLoginServerBanner={p.setLoginServerBanner} go={p.go}
        />
      );
    case "profile-setup": return <ScreenProfileSetup currentUser={p.currentUser} go={p.go} />;
    case "mfa": return <ScreenMFA mfaCode={p.mfaCode} setMfaCode={p.setMfaCode} mfaRefs={p.mfaRefs} go={p.go} />;
    case "home": return <ScreenHome {...p} />;
    case "rewards": return <ScreenRewards {...p} />;
    case "submit": return <ScreenSubmit go={p.go} screen={s} currentUser={p.currentUser} />;
    case "submit-scan": return <ScreenSubmitScan />;
    case "submit-confirm": return <ScreenSubmitConfirm weight={p.weight} weighing={p.weighing} onConfirm={p.onSubmitConfirm} />;
    case "submit-done": return <ScreenSubmitDone go={p.go} currentUser={p.currentUser} />;
    case "tasks": return <ScreenTasks {...p} />;
    case "leaderboard": return <ScreenLeaderboard {...p} />;
    case "notifications": return <ScreenNotifications {...p} />;
    case "profile": return <ScreenProfile {...p} />;
    case "settings": return <ScreenSettings {...p} />;
    case "history": return <ScreenHistory {...p} />;
    case "redeem-history": return <ScreenRedeemHistory {...p} />;
    case "redeem-confirm":
      return p.selectedReward ? <ScreenRedeemConfirm {...p} onRedeem={p.onRewardRedeem} onClose={p.onRewardClose} /> : <ScreenRewards {...p} />;
    default:
      return p.selectedReward ? <ScreenRewardDetail {...p} onClose={p.onRewardClose} onRedeem={p.onRewardRedeem} /> : <ScreenHome {...p} />;
  }
}

function ScreenSplash() {
  return (
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
        {[0,1,2].map(i => <div key={`item-${i}`} className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: `${i*0.3}s` }} />)}
      </div>
    </div>
  );
}

function ScreenOnboard1({ go }: Readonly<{ go: (s: MobileScreen) => void }>) {
  return (
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
        <button type="button" onClick={() => go("onboard2")} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base`}>Next</button>
        <button type="button" onClick={() => go("login")} className="w-full text-center text-sm text-muted-foreground font-semibold">Skip</button>
      </div>
    </div>
  );
}

function ScreenOnboard2({ go }: Readonly<{ go: (s: MobileScreen) => void }>) {
  return (
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
        <button type="button" onClick={() => go("onboard3")} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base`}>Next</button>
        <button type="button" onClick={() => go("login")} className="w-full text-center text-sm text-muted-foreground font-semibold">Skip</button>
      </div>
    </div>
  );
}

function ScreenOnboard3({ go }: Readonly<{ go: (s: MobileScreen) => void }>) {
  return (
    <div className="h-full min-h-[100dvh] flex flex-col max-w-xl w-full mx-auto" style={{ background: "linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)", paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
        <div className="w-48 h-48 rounded-full bg-amber-100 border-4 border-amber-200 flex items-center justify-center" style={{ boxShadow: "0 20px 60px rgba(217,119,6,0.15)" }}>
          <div className="text-8xl">🎁</div>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black text-foreground">Redeem Real Rewards</h2>
          <p className="text-muted-foreground text-sm mt-3 leading-relaxed">Turn points into groceries, load credits, school supplies, and partner vouchers — directly in the app.</p>
        </div>
      </div>
      <div className="px-8 space-y-4 shrink-0" style={{ paddingBottom: "calc(3rem + var(--sab))" }}>
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-muted" /><div className="w-2 h-2 rounded-full bg-muted" /><div className="w-6 h-2 rounded-full bg-primary" />
        </div>
        <button type="button" onClick={() => go("register")} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base`}>Create Account</button>
        <button type="button" onClick={() => go("login")} className="w-full text-center text-sm font-semibold text-muted-foreground">Already have an account? <span className="text-primary">Sign in</span></button>
      </div>
    </div>
  );
}

type ScreenRegisterProps = Readonly<{
  regStep: number;
  regFullName: string; regEmail: string; regPhone: string;
  regPassword: string; regConfirmPassword: string;
  regProvince: string; regCity: string; regBarangay: string;
  regStreetAddress: string;
  regError: string; regLoading: boolean;
  availableCities: string[]; availableBarangays: string[];
  setRegFullName: SetState<string>; setRegEmail: SetState<string>; setRegPhone: SetState<string>;
  setRegPassword: SetState<string>; setRegConfirmPassword: SetState<string>;
  setRegProvince: SetState<string>; setRegCity: SetState<string>; setRegBarangay: SetState<string>;
  setRegStreetAddress: SetState<string>; setRegError: SetState<string>;
  setRegStep: SetState<number>;
  go: (s: MobileScreen) => void;
  onStep1Next: () => void;
  onStep2Next: () => void;
  onStep3MFA: () => Promise<void>;
  onStep3Skip: () => Promise<void>;
}>;

function ScreenRegister(p: ScreenRegisterProps) {
  return (
    <div className="h-full min-h-[100dvh] flex flex-col overflow-y-auto"
         style={{ paddingTop: "calc(0.5rem + var(--sat))", paddingBottom: "calc(1.5rem + var(--sab))" }}>
      <div className="px-5 py-3 flex items-center gap-3 border-b border-border bg-white sticky top-0 z-20" style={{ top: "var(--sat)" }}>
        <button type="button" onClick={() => p.go("onboard3")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <div>
          <h2 className="text-base font-black text-foreground">Create Account</h2>
          <div className="flex gap-1 mt-1">
            {[1,2,3].map(s => <div key={s} className={`h-1 rounded-full transition-all ${p.regStep >= s-1 ? "bg-primary w-8" : "bg-muted w-4"}`} />)}
          </div>
        </div>
      </div>
      <div className="p-5 md:p-8 flex-1 max-w-xl w-full mx-auto">
        {p.regStep === 0 && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-3">Step 1 of 3 — Account Info</p>
              <div className="space-y-3">
                <Field label="Full Name" placeholder="Maria Santos" icon={<User className="w-4 h-4" />} value={p.regFullName} onChange={p.setRegFullName} />
                <Field label="Email Address" placeholder="maria@email.com" icon={<Mail className="w-4 h-4" />} value={p.regEmail} onChange={p.setRegEmail} />
                <Field label="Phone Number" placeholder="+63 912 345 6789" icon={<Phone className="w-4 h-4" />} value={p.regPhone} onChange={p.setRegPhone} />
                <Field label="Password" placeholder="••••••••" type="password" icon={<Lock className="w-4 h-4" />} value={p.regPassword} onChange={p.setRegPassword} />
                <Field label="Confirm Password" placeholder="••••••••" type="password" icon={<Lock className="w-4 h-4" />} value={p.regConfirmPassword} onChange={p.setRegConfirmPassword} />
              </div>
            </div>
            {p.regError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>{p.regError}</span>
              </div>
            )}
            <button type="button" onClick={p.onStep1Next} className={`w-full py-4 ${BTN_PRIMARY_CLS}`}>Continue</button>
          </div>
        )}
        {p.regStep === 1 && (
          <div className="space-y-4">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1">Step 2 of 3 — Community Address</p>
            {p.regError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>{p.regError}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-1">
              Select your <strong>Province</strong> first — City and Barangay options will auto-filter based on your choice.
            </p>
            <SelectField label="Province" placeholder="Select a Province..." icon={<MapPin className="w-4 h-4" />} value={p.regProvince} options={PROVINCES} onChange={(v) => { p.setRegProvince(v); p.setRegCity(""); p.setRegBarangay(""); }} />
            <SelectField label="City / Municipality" placeholder={p.regProvince ? "Select a City..." : "Select a Province first"} icon={<MapPin className="w-4 h-4" />} value={p.regCity} options={p.availableCities} disabled={!p.regProvince} onChange={(v) => { p.setRegCity(v); p.setRegBarangay(""); }} />
            <SelectField label="Barangay" placeholder={p.regCity ? "Select a Barangay..." : "Select a City first"} icon={<MapPin className="w-4 h-4" />} value={p.regBarangay} options={p.availableBarangays} disabled={!p.regCity} onChange={p.setRegBarangay} />
            <Field label="Street / House / Building No." placeholder="e.g. Block 12 Lot 5, Rizal Street or Purok 7" icon={<MapPin className="w-4 h-4" />} value={p.regStreetAddress} onChange={p.setRegStreetAddress} />
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex gap-2">
              <Info className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 font-semibold">
                No Region required. Leaderboards are based on Barangay level only; the street address above is used for delivery of redeemed items.
              </p>
            </div>
            <button type="button" onClick={p.onStep2Next} className={`w-full py-4 ${BTN_PRIMARY_CLS}`}>Continue</button>
            <button type="button" onClick={() => p.setRegStep(0)} className="w-full text-center text-sm text-muted-foreground font-semibold">Back</button>
          </div>
        )}
        {p.regStep === 2 && (
          <div className="space-y-4">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1">Step 3 of 3 — Security</p>
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 font-semibold leading-relaxed">Enable Multi-Factor Authentication to protect your account and points balance from unauthorized access.</p>
            </div>
            {p.regError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>{p.regError}</span>
              </div>
            )}
            <div className="grid grid-cols-4 gap-3 my-4">
              {[
                { i: "📱", l: "SMS" }, { i: "🔐", l: "Authenticator" },
                { i: "📧", l: "Email" }, { i: "🆔", l: "Barangay ID" },
              ].map((o) => (
                <label key={o.l} className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${o.l === "SMS" ? "border-primary bg-primary/5" : "border-border bg-white"}`}>
                  <div className="text-2xl">{o.i}</div>
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">{o.l}</div>
                </label>
              ))}
            </div>
            <button type="button" disabled={p.regLoading} onClick={p.onStep3MFA} className={`w-full py-4 ${BTN_PRIMARY_CLS} disabled:opacity-60`}>
              {p.regLoading ? "Creating account..." : "Enable MFA & Continue"}
            </button>
            <button type="button" disabled={p.regLoading} onClick={p.onStep3Skip} className="w-full text-center text-sm text-muted-foreground font-semibold disabled:opacity-60">Skip for now</button>
          </div>
        )}
      </div>
    </div>
  );
}

type ScreenLoginProps = Readonly<{
  email: string; password: string; loginError: string; loginLoading: boolean;
  setEmail: SetState<string>; setPassword: SetState<string>;
  showLoginServer: boolean; loginServerBanner: { type: "ok" | "err"; text: string } | null;
  apiHost: string; setApiHostState: SetState<string>;
  onToggleLoginServer: () => void; onLogin: () => Promise<void>;
  setLoginServerBanner: SetState<{ type: "ok" | "err"; text: string } | null>;
  go: (s: MobileScreen) => void;
}>;

function ScreenLogin(p: ScreenLoginProps) {
  return (
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
        <Field label="Email Address" placeholder="maria@email.com" icon={<Mail className="w-4 h-4" />} value={p.email} onChange={p.setEmail} />
        <Field label="Password" placeholder="••••••••" type="password" icon={<Lock className="w-4 h-4" />} value={p.password} onChange={p.setPassword} />
        <p className="text-right text-xs text-primary font-bold cursor-pointer shrink-0">Forgot Password?</p>
        {p.loginError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{p.loginError}</span>
          </div>
        )}
        <button type="button" onClick={p.onToggleLoginServer} className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-bold text-foreground shrink-0">
          <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Server IP Settings</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${p.showLoginServer ? "rotate-90" : ""}`} />
        </button>
        {p.showLoginServer && (
          <div className="space-y-2 shrink-0">
            {p.loginServerBanner && (
              <div className={`rounded-xl px-3 py-2 text-xs font-bold ${p.loginServerBanner.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>{p.loginServerBanner.text}</div>
            )}
            <ServerIpPanel apiHost={p.apiHost} setApiHostState={p.setApiHostState} onSaved={p.setLoginServerBanner} compact />
          </div>
        )}
        <div className="mt-auto space-y-3 pt-3 shrink-0">
          <button type="button" disabled={p.loginLoading} onClick={p.onLogin} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base disabled:opacity-60 flex items-center justify-center gap-2`}>
            {p.loginLoading ? "Signing in..." : "Sign In"}
          </button>
          <div className="flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="flex-1 h-px bg-border" /></div>
          <button type="button" className={`w-full py-3 ${BTN_SECONDARY_CLS} text-sm flex items-center justify-center gap-2`}>
            🇵🇭 Continue with Barangay ID
          </button>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground pt-5 shrink-0">New resident? <button type="button" onClick={() => p.go("register")} className="text-primary font-bold">Create account</button></p>
    </div>
  );
}

function ScreenProfileSetup({ currentUser, go }: Readonly<{ currentUser: any; go: (s: MobileScreen) => void }>) {
  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
      <div className="px-5 py-3 flex items-center gap-3 border-b border-border bg-white sticky top-0 z-20" style={{ top: "var(--sat)" }}>
        <button type="button" onClick={() => go("register")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <div>
          <h2 className="text-base font-black text-foreground">Almost done!</h2>
          <p className="text-xs text-muted-foreground">Complete your profile to earn <strong className="text-primary">+50 bonus pts</strong></p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-24">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
              <User className="w-10 h-10 text-primary/40" />
            </div>
            <button type="button" className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-white">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground font-semibold">Upload a profile photo (optional)</p>
        </div>
        <Field label="Display Name" placeholder="Your display name" icon={<User className="w-4 h-4" />} defaultVal={currentUser.name && currentUser.name !== "Guest User" ? currentUser.name : ""} />
        <div>
          <label htmlFor="profile-bio" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Bio (optional)</label>
          <textarea id="profile-bio" className={INPUT_BASE_CLS} rows={3} placeholder="I recycle because I care about my community..." />
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 flex gap-2">
          <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 font-semibold">Complete your profile to earn a <strong>50 bonus points</strong> welcome gift!</p>
        </div>
        <button type="button" onClick={() => go("home")} className={`w-full py-4 ${BTN_PRIMARY_CLS}`}>Start Recycling!</button>
      </div>
    </div>
  );
}

type ScreenMFAProps = Readonly<{ mfaCode: string[]; setMfaCode: (v: string[]) => void; mfaRefs: React.RefObject<(HTMLInputElement | null)[]>; go: (s: MobileScreen) => void; }>;
function ScreenMFA({ mfaCode, setMfaCode, mfaRefs, go }: ScreenMFAProps) {
  return (
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
          <input key={`mfa-digit-${["one","two","three","four","five","six"][i]}`}
            ref={el => { mfaRefs.current[i] = el; }}
            value={d}
            maxLength={1}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, "");
              if (!v) { setMfaCode(mfaCode.map((c, idx) => idx === i ? "" : c)); return; }
              const copy = [...mfaCode]; copy[i] = v; setMfaCode(copy);
              if (v && i < 5) mfaRefs.current[i + 1]?.focus();
              if (!v && i > 0) mfaRefs.current[i - 1]?.focus();
            }}
            onKeyDown={e => { if (e.key === "Backspace" && !mfaCode[i] && i > 0) { mfaRefs.current[i - 1]?.focus(); } }}
            inputMode="numeric"
            className={`w-12 h-14 rounded-xl border-2 text-center text-xl font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${mfaCode[i] ? "border-primary bg-primary/5" : "border-border bg-white"}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Didn't receive a code? <span className="text-primary font-bold">Resend</span></p>
      <button type="button" onClick={() => go("profile-setup")} className={`w-full max-w-xs py-4 ${BTN_PRIMARY_CLS} text-base`}>Verify & Continue</button>
    </div>
  );
}

function ScreenSubmit({
  go,
  screen,
  currentUser,
}: Readonly<{
  go: (s: MobileScreen) => void;
  screen: MobileScreen;
  currentUser: MobileUserShape;
}>) {
  const [manualCode, setManualCode] = useState("K-01");
  const [connecting, setConnecting] = useState(false);

  const handleConnectKiosk = (code: string) => {
    const kId = code.trim().toUpperCase() || "K-01";
    setConnecting(true);
    publishQrBridge(kId, currentUser);
    setTimeout(() => {
      setConnecting(false);
      go("submit-confirm");
    }, 600);
  };

  const nearbyKiosks = [
    { id: "K-01", name: "Cabantian Barangay Hall Kiosk", status: "Online", dist: "50m away" },
    { id: "K-02", name: "Cabantian Elementary School", status: "Online", dist: "320m away" },
    { id: "K-04", name: "Cabantian Covered Court", status: "Online", dist: "650m away" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
      <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ top: "var(--sat)" }}>
        <button type="button" onClick={() => go("home")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <div>
          <h2 className="text-base font-black text-foreground">Submit Recycling</h2>
          <p className="text-xs text-muted-foreground">Select a kiosk, enter code, or scan QR</p>
        </div>
      </div>
      <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-28">
        {/* Quick Kiosk Selection */}
        <div className="bg-white p-4 rounded-2xl border border-border space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-foreground uppercase tracking-wide">Quick Connect: Nearby Kiosks</p>
            <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">● Ready</span>
          </div>
          <div className="space-y-2">
            {nearbyKiosks.map(k => (
              <button
                key={k.id}
                type="button"
                onClick={() => handleConnectKiosk(k.id)}
                className="w-full p-3 rounded-xl border border-border hover:border-primary hover:bg-green-50/50 transition-all flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center font-mono font-black text-xs text-green-800">
                    {k.id}
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground">{k.name}</p>
                    <p className="text-[10px] text-muted-foreground">{k.dist} • {k.status}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors">
                  Connect
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Kiosk Code Input */}
        <div className="p-5 rounded-2xl border border-border bg-white space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center"><Keyboard className="w-5 h-5" /></div>
            <div>
              <p className="font-black text-sm text-foreground">Enter Kiosk Code Manually</p>
              <p className="text-xs text-muted-foreground">Type the kiosk ID (e.g., K-01, K-02) shown on screen</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={manualCode}
                onChange={e => setManualCode(e.target.value.toUpperCase())}
                placeholder="K-01"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border font-mono font-black text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="button"
              disabled={connecting || !manualCode.trim()}
              onClick={() => handleConnectKiosk(manualCode)}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {connecting ? "Linking..." : "Link & Weigh"}
            </button>
          </div>
        </div>

        {/* Camera QR Alternative */}
        <button type="button" onClick={() => go("submit-scan")} className="w-full text-left p-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><ScanLine className="w-5 h-5" /></div>
          <div className="flex-1">
            <p className="font-black text-xs text-foreground">Or Scan Kiosk QR Code</p>
            <p className="text-[10px] text-muted-foreground">Optional: Point camera at kiosk screen to connect</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex gap-2.5">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 font-semibold leading-relaxed">Once connected, drop items into the weighing receptacle on the kiosk. Points will calculate and deposit directly to your wallet.</p>
        </div>
      </div>
      <MobileBottomNav screen={screen} go={go} />
    </div>
  );
}

function ScreenSubmitScan() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-black" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
      <div className="px-5 py-3 flex items-center gap-3 border-b border-white/10 sticky top-0 z-10" style={{ top: "var(--sat)" }}>
        <h2 className="text-base font-black text-white flex-1 text-center pr-10">Scan Kiosk QR</h2>
      </div>
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <div id="qr-reader" className="w-full max-w-md" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-64 h-64 rounded-3xl border-[3px] border-green-400/80 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64">
            <div className="h-[3px] w-full bg-green-400 rounded-full animate-pulse" />
          </div>
        </div>
        <p className="absolute bottom-12 left-1/2 -translate-x-1/2 text-xs text-white/80 font-semibold text-center w-full px-8">Align the QR code within the frame</p>
      </div>
    </div>
  );
}

function ScreenSubmitConfirm({ weight, weighing, onConfirm }: Readonly<{ weight: any; weighing: boolean; onConfirm: () => void }>) {
  return (
    <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
      <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ top: "var(--sat)" }}>
        <h2 className="text-base font-black text-foreground flex-1 text-center pr-10">Weighing Items</h2>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        <div className="relative">
          <div className="w-56 h-56 rounded-full border-[6px] border-border bg-white flex items-center justify-center" style={{ boxShadow: "inset 0 -8px 32px rgba(0,0,0,0.05), 0 10px 40px rgba(34,197,94,0.1)" }}>
            <div className="flex flex-col items-center">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${weighing ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{weighing ? "Measuring..." : "Place items"}</span>
              <AnimatedNumber value={weight as number} suffix=" kg" className="text-5xl font-black text-foreground mt-3 tracking-tight" />
              <p className="text-xs text-muted-foreground mt-2">~ <AnimatedNumber value={Math.round((weight as number) * 10)} suffix=" pts earned" className="text-xs font-black text-primary" /></p>
            </div>
          </div>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={`item-${i}`} className="absolute left-1/2 top-1/2 w-0.5 h-3 bg-muted-foreground/30 origin-bottom" style={{ transform: `translate(-50%, -100%) rotate(${i * 30}deg) translateY(-108px)` }} />
          ))}
        </div>
        <div className="w-full max-w-md space-y-2">
          {[
            { m: "PET Bottle", w: "0.8 kg", p: "+8 pts", c: "bg-blue-50 border-blue-200", ic: "🧴" },
            { m: "Cardboard", w: "1.2 kg", p: "+12 pts", c: "bg-amber-50 border-amber-200", ic: "📦" },
            { m: "Aluminum Can", w: "0.3 kg", p: "+3 pts", c: "bg-emerald-50 border-emerald-200", ic: "🥫" },
          ].map(r => (
            <div key={r.m} className={`flex items-center gap-3 p-3 rounded-xl border ${r.c}`}>
              <div className="text-2xl">{r.ic}</div>
              <div className="flex-1">
                <p className="text-xs font-black text-foreground">{r.m}</p>
                <p className="text-[10px] text-muted-foreground">{r.w}</p>
              </div>
              <p className="text-xs font-black text-primary">{r.p}</p>
            </div>
          ))}
        </div>
        <div className="w-full max-w-md space-y-3 pt-2">
          <div className="flex items-center justify-between text-sm px-1">
            <span className="text-muted-foreground font-semibold">Estimated points</span>
            <span className="font-black text-primary">+{Math.round((weight as number) * 10)} pts</span>
          </div>
          <button type="button" onClick={onConfirm} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base`}>Confirm & Earn Points</button>
        </div>
      </div>
    </div>
  );
}

function ScreenSubmitDone({ go, currentUser }: Readonly<{ go: (s: MobileScreen) => void; currentUser: any }>) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-8 gap-6 overflow-y-auto" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
      <div className="relative">
        <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-14 h-14 text-green-500" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-primary border-4 border-white flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-foreground">Points Earned!</h2>
        <p className="text-5xl font-black text-primary tracking-tight">+23 pts</p>
        <p className="text-muted-foreground text-sm mt-2">2.3 kg recycled · Thank you, {currentUser.initials}!</p>
      </div>
      <div className="w-full max-w-md space-y-3">
        <div className="rounded-2xl border border-border bg-white p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0"><Trophy className="w-6 h-6 text-green-500" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">New balance</p>
            <p className="font-black text-foreground">{Number(currentUser.points || 0) + 23} total points</p>
          </div>
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
          <Leaf className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-semibold leading-relaxed">🌍 You saved ~2.5 kg CO₂ today. Keep going!</p>
        </div>
        <button type="button" onClick={() => go("home")} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base`}>Back to Home</button>
      </div>
    </div>
  );
}

function ScreenHome(p: MobileAppRouterProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
      <div className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
        <div>
          <p className="text-xs text-muted-foreground font-semibold">Good morning,</p>
          <h2 className="text-xl font-black text-foreground">{(p.currentUser.name && p.currentUser.name.trim() !== "") ? `${p.currentUser.name.split(" ")[0]} 👋` : "👋"}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => p.go("notifications")} className="relative p-2.5 rounded-xl border border-border bg-white hover:bg-secondary transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {p.notifUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">{p.notifUnread <= 9 ? p.notifUnread : "9+"}</span>
            )}
          </button>
          <button type="button" onClick={() => p.go("profile")} className="w-10 h-10 rounded-full bg-primary text-white font-black text-sm flex items-center justify-center">{p.currentUser.initials}</button>
        </div>
      </div>
      <div className="p-5 space-y-5 overflow-y-auto flex-1 pb-32">
        <div className="rounded-3xl p-5 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #166534 0%, #14532d 50%, #0c4a6e 100%)", boxShadow: "0 20px 50px rgba(22,101,52,0.3)" }}>
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -right-16 bottom-0 w-56 h-56 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-200">Points Balance</p>
                <h3 className="text-4xl font-black mt-1 tracking-tight">{p.currentUser.points?.toLocaleString()}</h3>
                <p className="text-[11px] text-green-200 mt-0.5">{p.profileSinceLabel}</p>
              </div>
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold">{p.profileRank}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
              {[
                { l: "Recycled", v: `${(p.currentUser.totalKg || 0).toFixed(1)} kg`, i: <Recycle className="w-4 h-4" /> },
                { l: "Streak", v: `${p.currentUser.streak || 0} d`, i: <Flame className="w-4 h-4" /> },
                { l: "Badges", v: `${p.currentUser.badges || 0}`, i: <Award className="w-4 h-4" /> },
              ].map(s => (
                <div key={s.l} className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-white/5">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">{s.i}</div>
                  <p className="text-sm font-black">{s.v}</p>
                  <p className="text-[9px] text-green-200 font-bold uppercase tracking-wider">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => p.go("submit")} className="rounded-2xl p-4 text-left bg-white border border-border hover:border-primary transition-colors">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3"><Upload className="w-5 h-5 text-primary" /></div>
            <p className="text-sm font-black text-foreground">Submit Items</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Scan QR at kiosk</p>
          </button>
          <button type="button" onClick={() => p.go("rewards")} className="rounded-2xl p-4 text-left bg-white border border-border hover:border-primary transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3"><Gift className="w-5 h-5 text-amber-500" /></div>
            <p className="text-sm font-black text-foreground">Redeem Rewards</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Spend your points</p>
          </button>
          <button type="button" onClick={() => p.go("tasks")} className="rounded-2xl p-4 text-left bg-white border border-border hover:border-primary transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3"><CheckSquare2 className="w-5 h-5 text-blue-500" /></div>
            <p className="text-sm font-black text-foreground">Daily Tasks</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Earn bonus points</p>
          </button>
          <button type="button" onClick={() => p.go("leaderboard")} className="rounded-2xl p-4 text-left bg-white border border-border hover:border-primary transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3"><Trophy className="w-5 h-5 text-purple-500" /></div>
            <p className="text-sm font-black text-foreground">Leaderboard</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Top barangay recyclers</p>
          </button>
        </div>
        {p.kioskSession.connected && (
          <button type="button" onClick={p.handleDisconnectKiosk} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center"><Cable className="w-4 h-4 text-emerald-900" /></div>
              <div className="text-left">
                <p className="text-xs font-black">Linked to {p.kioskSession.kioskId || "kiosk"}</p>
                <p className="text-[10px] text-emerald-700 font-semibold">{elapsedFromTs(p.kioskSession.connectedAt) || "Active session"}{p.kioskChecking ? " · checking..." : ""}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-emerald-400 text-emerald-900 px-2 py-1 rounded-full">Tap to disconnect</span>
          </button>
        )}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-foreground">Community Leaderboard</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Top residents &amp; your barangay rank</p>
            </div>
            <button type="button" onClick={() => p.go("leaderboard")} className="text-xs font-bold text-primary hover:underline">
              View all ({p.mergedLeaderboard.length}) →
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-xs divide-y divide-border">
            {/* Top 3 Residents */}
            {p.mergedLeaderboard.slice(0, 3).map((u: any, i: number) => {
              const isYou = u._isYou || u.isMe;
              return (
                <div key={u.id || u.userId || `top-${i}`} className={`flex items-center gap-3 px-4 py-3 ${isYou ? "bg-green-50/70" : ""}`}>
                  <RankIcon rank={i + 1} />
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 border-white shadow-sm ${isYou ? "bg-primary text-white ring-2 ring-primary/30" : "bg-gradient-to-br from-primary to-emerald-600 text-white"}`}>
                    {u._initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-black text-foreground truncate">{u.displayName}</p>
                      {isYou && <span className="text-[9px] bg-primary text-white font-black px-1.5 py-0.2 rounded-full">YOU</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-semibold">{u.barangay || "Cabantian"} · Level {Math.floor(Number(u.points || 0) / 500) + 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">{Number(u.points || 0).toLocaleString()} pts</p>
                    <p className="text-[10px] text-muted-foreground">{(u.totalKg || 0).toFixed(1)} kg</p>
                  </div>
                </div>
              );
            })}

            {/* If current user is not in top 3, show their row pinned below */}
            {(() => {
              const myEntry = p.mergedLeaderboard.find((u: any) => u._isYou || u.isMe);
              if (myEntry && myEntry.rank > 3) {
                return (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border-t-2 border-primary/20">
                    <span className="w-6 text-center text-xs font-black text-primary font-mono">#{myEntry.rank}</span>
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm border-2 border-white shadow-sm ring-2 ring-primary/30">
                      {myEntry._initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-black text-foreground truncate">{myEntry.displayName}</p>
                        <span className="text-[9px] bg-primary text-white font-black px-1.5 py-0.2 rounded-full">YOU</span>
                      </div>
                      <p className="text-[10px] text-primary font-semibold">{myEntry.barangay || "Cabantian"} · Your Current Standing</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">{Number(myEntry.points || 0).toLocaleString()} pts</p>
                      <p className="text-[10px] text-muted-foreground">{(myEntry.totalKg || 0).toFixed(1)} kg</p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
      <MobileBottomNav screen={p.screen} go={p.go} />
    </div>
  );
}

function ScreenRewards(p: MobileAppRouterProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
      <div className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
        <div>
          <p className="text-xs text-muted-foreground font-semibold">Points: <span className="text-primary font-black">{p.currentUser.points?.toLocaleString()}</span></p>
          <h2 className="text-xl font-black text-foreground">Rewards Catalog</h2>
        </div>
      </div>
      <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-32">
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
          {p.rewardCategories.map(c => (
            <button type="button" key={c} onClick={() => p.setRewardFilter(c)} className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${p.rewardFilter === c ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{c}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {p.filteredRewards.map(r => {
            const canRedeem = (Number(p.currentUser.points || 0) >= r.cost);
            const cls = canRedeem ? "bg-primary text-white" : "bg-muted text-muted-foreground";
            return (
              <button
                type="button"
                key={r.name}
                onClick={() => p.setSelectedReward(r)}
                className={`rounded-2xl border bg-white text-left overflow-hidden transition-all hover:shadow-md cursor-pointer ${
                  canRedeem ? "border-green-200 hover:border-primary ring-1 ring-green-100" : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <div className="relative aspect-square bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center text-5xl">
                  <div className="text-5xl">{r.icon}</div>
                  {r.seasonal && <div className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">⭐ Seasonal</div>}
                </div>
                <div className="p-3 space-y-1.5">
                  <p className="text-sm font-black text-foreground line-clamp-2 leading-tight min-h-[2.5rem]">{r.name}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className={`font-black px-2.5 py-1 rounded-full ${cls}`}>{r.cost} pts</span>
                    <span className="text-[10px] text-muted-foreground font-bold capitalize">{r.category}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <MobileBottomNav screen={p.screen} go={p.go} />
      {p.selectedReward && (
        <ScreenRewardDetail {...p} onClose={p.onRewardClose} onRedeem={p.onRewardRedeem} />
      )}
    </div>
  );
}

type DetailProps = MobileAppRouterProps & Readonly<{ onClose: () => void; onRedeem: () => Promise<void> }>;
function ScreenRewardDetail(p: DetailProps) {
  const r = p.selectedReward!;
  const canRedeem = Number(p.currentUser.points || 0) >= r.cost;
  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-background rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-8 duration-300">
        <div className="relative aspect-square bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
          <div className="text-[8rem]">{r.icon}</div>
          <button type="button" onClick={p.onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur border border-border flex items-center justify-center"><X className="w-5 h-5 text-foreground" /></button>
          {r.seasonal && <div className="absolute top-4 left-4 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">⭐ Limited Seasonal</div>}
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{r.category}</p>
              <h2 className="text-2xl font-black text-foreground mt-1 leading-tight">{r.name}</h2>
            </div>
            <span className="flex-shrink-0 px-3 py-1.5 rounded-full bg-primary text-white font-black">{r.cost} pts</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { l: "Stock", v: r.stock }, { l: "Delivery", v: r.delivery }, { l: "Validity", v: r.validity },
            ].map(s => (
              <div key={s.l} className="rounded-xl border border-border bg-white p-3">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{s.l}</p>
                <p className="text-xs font-black text-foreground mt-1">{s.v}</p>
              </div>
            ))}
          </div>
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${canRedeem ? BADGE_OK_BG : BADGE_DANGER_BG}`}>
            <Wallet className={`w-5 h-5 ${canRedeem ? "text-green-700" : "text-red-700"}`} />
            <div>
              <p className="text-xs font-black">{canRedeem ? "✅ You have enough points" : "⚠️ Need more points"}</p>
              <p className="text-[10px] font-semibold mt-0.5">{canRedeem ? `Balance after redeem: ${(Number(p.currentUser.points || 0) - r.cost).toLocaleString()} pts` : `Short by ${(r.cost - Number(p.currentUser.points || 0)).toLocaleString()} pts — submit more recycling!`}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" onClick={p.onClose} className={`py-4 ${BTN_SECONDARY_CLS} text-base`}>Close</button>
            <button type="button" disabled={!canRedeem} onClick={p.onRedeem} className={`py-4 ${BTN_PRIMARY_CLS} text-base disabled:opacity-60`}>Redeem Now</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTaskTypeBadgeClass(type: string): string {
  if (type === "daily") return "bg-blue-100 text-blue-700";
  if (type === "weekly") return "bg-purple-100 text-purple-700";
  return "bg-amber-100 text-amber-700";
}

function ScreenTasks(p: MobileAppRouterProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
      <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
        <h2 className="text-xl font-black text-foreground flex-1">Daily Tasks</h2>
      </div>
      <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-32">
        <div className="rounded-2xl p-4 border border-border bg-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-black text-foreground">Daily progress</p>
            <p className="text-xs font-black text-primary">3 of 5</p>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: "60%" }} /></div>
          <p className="text-[10px] text-muted-foreground mt-1 font-semibold">Complete 5 tasks to unlock <strong>+100 bonus pts</strong></p>
        </div>
        {[
          { t: "Submit 1kg of recyclables", pts: "+50 pts", type: "daily", p: "daily", d: true },
          { t: "Use app 3 days in a row", pts: "+25 pts", type: "daily", p: "daily", d: true },
          { t: "Invite 1 neighbor", pts: "+100 pts", type: "daily", p: "daily", d: false },
          { t: "Attend barangay event", pts: "+200 pts", type: "weekly", p: "weekly", d: false },
          { t: "Redeem 1 reward", pts: "+75 pts", type: "monthly", p: "monthly", d: false },
        ].map((t, i) => (
          <div key={t.t} className="rounded-2xl border border-border bg-white p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.d ? "bg-green-50 text-green-600" : "bg-muted text-muted-foreground"}`}>{t.d ? <CheckSquare2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-foreground">{t.t}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${getTaskTypeBadgeClass(t.type)}`}>{t.p}</span>
                <span className="text-xs font-black text-primary">{t.pts}</span>
              </div>
            </div>
            <button type="button" disabled={t.d} className={`px-3 py-1.5 rounded-xl text-xs font-black ${t.d ? "bg-green-500 text-white cursor-default" : [BTN_PRIMARY_CLS, "px-3 py-1.5 text-xs"].join(" ")}`}>{t.d ? "Done" : "Start"}</button>
          </div>
        ))}
      </div>
      <MobileBottomNav screen={p.screen} go={p.go} />
    </div>
  );
}

function ScreenLeaderboard(p: MobileAppRouterProps) {
  const [viewMode, setViewMode] = useState<"top" | "all">("top");
  const myUserInLeaderboard = p.mergedLeaderboard.find((u: any) => u._isYou || u.isMe) || {
    rank: p.profileRank || "#-",
    displayName: p.currentUser.name || "You",
    points: p.currentUser.points || 0,
    barangay: p.currentUser.barangay || "Cabantian",
    _initials: p.currentUser.initials || "U",
  };

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
      <div className="sticky top-0 z-10 bg-background border-b border-border" style={{ paddingTop: "calc(0.5rem + var(--sat))" }}>
        <div className="px-5 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-foreground">🏆 Community Leaderboard</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Top residents &amp; community recyclers in <strong>{p.currentUser.barangay || "Cabantian"}</strong></p>
          </div>
          <button
            type="button"
            onClick={() => setViewMode(v => v === "top" ? "all" : "top")}
            className="px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors"
          >
            {viewMode === "top" ? "Show Full Community" : "Show Top Podium"}
          </button>
        </div>
        <div className="flex border-b border-border px-5">
          {(["weekly","monthly"] as const).map(t => (
            <button type="button" key={t} onClick={() => p.setLeaderTab(t)} className={`px-4 py-2 text-xs font-black capitalize transition-colors relative ${p.leaderTab === t ? "text-primary" : "text-muted-foreground"}`}>
              {t} Ranking
              {p.leaderTab === t && <div className="absolute left-3 right-3 -bottom-px h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-32">
        {/* Pinned Your Standing Card */}
        <div className="bg-gradient-to-r from-green-700 to-emerald-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white text-green-800 font-black flex items-center justify-center text-sm shadow-xs border-2 border-green-200">
              {myUserInLeaderboard._initials}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-green-200">Your Current Standing</p>
              <p className="text-sm font-black text-white">{myUserInLeaderboard.displayName} (You)</p>
              <p className="text-[11px] text-green-200">{myUserInLeaderboard.barangay || "Cabantian"} · Level {Math.floor(Number(myUserInLeaderboard.points || 0) / 500) + 1}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-black">Rank #{myUserInLeaderboard.rank}</span>
            <p className="text-base font-black text-green-100 mt-1">{Number(myUserInLeaderboard.points || 0).toLocaleString()} pts</p>
          </div>
        </div>

        {/* Top 3 Podium (when in Top mode) */}
        {viewMode === "top" && p.mergedLeaderboard.length >= 3 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Top Residents</p>
              <span className="text-[10px] font-bold text-primary">🥇 Podium Highlights</span>
            </div>
            <div className="grid grid-cols-3 gap-2 items-end">
              {[
                { r: 2, u: p.mergedLeaderboard[1], c: "from-slate-100 to-slate-200 border-slate-300", h: "h-32", pl: "🥈" },
                { r: 1, u: p.mergedLeaderboard[0], c: "from-amber-100 to-amber-200 border-amber-300", h: "h-40", pl: "🏆" },
                { r: 3, u: p.mergedLeaderboard[2], c: "from-orange-100 to-orange-200 border-orange-300", h: "h-28", pl: "🥉" },
              ].map(pod => (
                <div key={pod.r} className={`rounded-2xl border bg-gradient-to-b ${pod.c} p-3 flex flex-col items-center justify-end ${pod.h} relative shadow-xs`}>
                  {pod.u && (
                    <>
                      <div className="absolute -top-4 text-3xl">{pod.pl}</div>
                      <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center font-black text-sm border-2 border-white shadow-sm mb-1.5">{pod.u._initials}</div>
                      <p className="text-xs font-black text-foreground text-center truncate w-full">{pod.u._isYou ? `${pod.u.displayName} (You)` : pod.u.displayName}</p>
                      <p className="text-[10px] font-black text-primary mt-0.5">{Number(pod.u.points || 0).toLocaleString()} pts</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Community List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Community Rankings</p>
            <span className="text-[10px] text-muted-foreground font-semibold">{p.mergedLeaderboard.length} Residents</span>
          </div>

          <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-xs">
            {p.mergedLeaderboard.map((u: any, i: number) => {
              const isYou = u._isYou || u.isMe;
              return (
                <div
                  key={u.id || u.userId || `leader-${i}`}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    i !== p.mergedLeaderboard.length - 1 ? "border-b border-border" : ""
                  } ${isYou ? "bg-green-50/80 ring-1 ring-inset ring-green-200" : ""}`}
                >
                  <RankIcon rank={u.rank || i + 1} />
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 border-white shadow-sm ${isYou ? "bg-primary text-white ring-2 ring-primary/30" : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"}`}>
                    {u._initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-black text-foreground truncate">{u.displayName}</p>
                      {isYou && <span className="text-[9px] bg-primary text-white font-black px-1.5 py-0.2 rounded-full">YOU</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-semibold">{u.barangay || "Cabantian"} · Level {Math.floor(Number(u.points || 0) / 500) + 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">{Number(u.points || 0).toLocaleString()} pts</p>
                    <p className="text-[10px] text-muted-foreground">{(u.totalKg || 0).toFixed(1)} kg</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <MobileBottomNav screen={p.screen} go={p.go} />
    </div>
  );
}

function ScreenNotifications(p: MobileAppRouterProps) {
  const items = p.notifItems.length > 0 ? p.notifItems : [
    { title: "+23 Points Earned", desc: "You recycled 2.3 kg at Kiosk 01", time: "2h ago", i: "🎁", c: "bg-green-50 border-green-200", unread: true },
    { title: "New Weekly Task", desc: "Submit 1kg to unlock bonus 50 points", time: "8h ago", i: "📋", c: "bg-blue-50 border-blue-200", unread: true },
    { title: "Seasonal Reward: Christmas Grocery", desc: "Now available in the catalog!", time: "1d ago", i: "🎄", c: "bg-red-50 border-red-200", unread: false },
    { title: "Welcome to Waste2Goods!", desc: "+50 bonus points for completing onboarding", time: "3d ago", i: "🎉", c: "bg-amber-50 border-amber-200", unread: false },
  ];
  return (
    <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
      <div className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
        <h2 className="text-xl font-black text-foreground">Notifications</h2>
        <p className="text-xs font-bold text-muted-foreground">{p.notifUnread || 0} unread</p>
      </div>
      <div className="p-5 space-y-3 overflow-y-auto flex-1 pb-32">
        {items.map((n: any) => (
          <div key={String(n.id ?? n.title)} className={`rounded-2xl p-4 flex items-start gap-4 border ${n.c}`}>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl flex-shrink-0 border border-white shadow-sm">{n.i}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-black text-foreground">{n.title}</p>
                {n.unread && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
              </div>
              <p className="text-xs text-foreground/80 mt-0.5">{n.desc}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5 font-semibold">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
      <MobileBottomNav screen={p.screen} go={p.go} />
    </div>
  );
}

function ScreenProfile(p: MobileAppRouterProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
      <div className="relative overflow-hidden" style={{ paddingTop: "calc(0.5rem + var(--sat))", background: "linear-gradient(135deg, #166534 0%, #14532d 50%, #0c4a6e 100%)" }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-20 top-0 w-64 h-64 rounded-full bg-white/20" />
          <div className="absolute -left-10 -bottom-20 w-80 h-80 rounded-full bg-green-400/20" />
        </div>
        <div className="relative px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-black text-white">My Profile</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => p.go("settings")} className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white"><Settings className="w-4 h-4" /></button>
            <button type="button" onClick={() => { Waste2GoodsAPI.logout(); p.go("login"); }} className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white" title="Sign out"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="relative z-10 px-5 pb-8 flex items-end gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur flex items-center justify-center border-2 border-white/30">
              <span className="text-white text-2xl font-black">{p.currentUser.initials}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary border-2 border-white flex items-center justify-center"><Camera className="w-3.5 h-3.5 text-white" /></div>
          </div>
          <div className="flex-1 pb-1 min-w-0">
            <p className="text-lg font-black text-white truncate">{p.currentUser.name || "Guest User"}</p>
            <p className="text-xs text-green-200 font-semibold mt-0.5">Level {p.currentUser.level || 1} Recycler · {p.profileRank}</p>
            <div className="flex items-center gap-2 mt-1.5"><span className="text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full text-green-100">{p.profileSinceLabel}</span></div>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-32 -mt-4">
        <div className="rounded-3xl bg-white border border-border p-4 -mt-4 relative shadow-sm">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { l: "Points", v: Number(p.currentUser.points || 0).toLocaleString(), c: "text-primary" },
              { l: "Recycled", v: `${(p.currentUser.totalKg || 0).toFixed(1)}kg`, c: "text-emerald-600" },
              { l: "Streak", v: `${p.currentUser.streak || 0}d`, c: "text-orange-600" },
              { l: "Badges", v: `${p.currentUser.badges || 0}`, c: "text-blue-600" },
            ].map(s => (
              <div key={s.l} className="flex flex-col items-center gap-0.5 py-2">
                <p className={`text-lg font-black ${s.c} leading-none`}>{s.v}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 space-y-3">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Recent activity</p>
          {[
            { t: "Recycled PET bottles", v: "+8 pts", sub: "K-01 · 2h ago", i: "🧴", c: "bg-blue-50" },
            { t: "Redeemed: P50 Load", v: "-500 pts", sub: "Today · 9:12 AM", i: "📱", c: "bg-purple-50" },
            { t: "Daily streak", v: "+25 pts", sub: "3 days in a row!", i: "🔥", c: "bg-orange-50" },
            { t: "Level 2 Milestone", v: "+100 pts", sub: "2 days ago", i: "⭐", c: "bg-amber-50" },
          ].map(a => (
            <div key={a.t} className={`rounded-xl p-3 flex items-center gap-3 ${a.c}`}>
              <div className="text-2xl">{a.i}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-foreground truncate">{a.t}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{a.sub}</p>
              </div>
              <span className={`text-xs font-black ${a.v.startsWith("-") ? "text-red-500" : "text-primary"}`}>{a.v}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <button type="button" onClick={() => p.go("history")} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-border hover:border-primary transition-colors">
            <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center"><Recycle className="w-4 h-4 text-primary" /></div><div className="text-left"><p className="text-sm font-black text-foreground">Recycling History</p><p className="text-[10px] text-muted-foreground font-semibold">All submitted items</p></div></div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button type="button" onClick={() => p.go("redeem-history")} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-border hover:border-primary transition-colors">
            <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center"><Package className="w-4 h-4 text-amber-600" /></div><div className="text-left"><p className="text-sm font-black text-foreground">My Redemptions</p><p className="text-[10px] text-muted-foreground font-semibold">Redeemed rewards & delivery</p></div></div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button type="button" onClick={() => p.go("tasks")} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-border hover:border-primary transition-colors">
            <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><CheckSquare2 className="w-4 h-4 text-blue-600" /></div><div className="text-left"><p className="text-sm font-black text-foreground">Achievements</p><p className="text-[10px] text-muted-foreground font-semibold">Milestones & badges</p></div></div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button type="button" onClick={() => p.go("settings")} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-border hover:border-primary transition-colors">
            <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><Settings className="w-4 h-4 text-muted-foreground" /></div><div className="text-left"><p className="text-sm font-black text-foreground">Settings</p><p className="text-[10px] text-muted-foreground font-semibold">Account, server IP, security</p></div></div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      <MobileBottomNav screen={p.screen} go={p.go} />
    </div>
  );
}

function ScreenSettings(p: MobileAppRouterProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
      <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
        <button type="button" onClick={() => p.go("profile")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <h2 className="text-xl font-black text-foreground flex-1">Settings</h2>
      </div>
      <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-16">
        {p.profileBanner && (
          <div className={`rounded-xl px-4 py-3 text-sm font-bold ${p.profileBanner.type === "ok" ? BADGE_OK_BG : BADGE_DANGER_BG}`}>{p.profileBanner.text}</div>
        )}
        <div className="rounded-2xl border border-border bg-white p-5 space-y-3">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Edit profile</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" placeholder="Maria" icon={<User className="w-4 h-4" />} value={p.setFName} onChange={p.setSetFName} />
            <Field label="Last Name" placeholder="Santos" icon={<User className="w-4 h-4" />} value={p.setLName} onChange={p.setSetLName} />
          </div>
          <Field label="Email" placeholder="maria@email.com" icon={<Mail className="w-4 h-4" />} value={p.setFormEmail} onChange={p.setSetFormEmail} />
          <Field label="Phone Number" placeholder="+63 912 345 6789" icon={<Phone className="w-4 h-4" />} value={p.setPhone} onChange={p.setSetPhone} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Province" placeholder="Metro Manila" icon={<MapPin className="w-4 h-4" />} value={p.setProvince} onChange={p.setSetProvince} />
            <Field label="City" placeholder="Quezon City" icon={<MapPin className="w-4 h-4" />} value={p.setCity} onChange={p.setSetCity} />
            <Field label="Barangay" placeholder="Commonwealth" icon={<MapPin className="w-4 h-4" />} value={p.setBrgy} onChange={p.setSetBrgy} />
          </div>
          <button type="button" onClick={p.handleSaveProfile} disabled={p.profileSaving} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base disabled:opacity-60`}>
            {p.profileSaving ? "Saving..." : "💾 Save Changes"}
          </button>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Backend Server IP</p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">XAMPP LAN IP where Waste2Goods backend runs. Mobile app expects raw IP (no http:// or port).</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><Globe className="w-4 h-4 text-blue-600" /></div>
          </div>
          <ServerIpPanel apiHost={p.apiHost} setApiHostState={p.setApiHostState} onSaved={() => p.setProfileBanner({ type: "ok", text: "✅ Server IP saved. API requests will use this host." })} />
        </div>
      </div>
    </div>
  );
}

function ScreenHistory(p: MobileAppRouterProps) {
  const items = [
    { t: "Mixed recyclables", v: "+23 pts", sub: "2.3 kg · K-01 · 2h ago", i: "♻️", c: "bg-green-50", kg: "2.3kg", p: "+23" },
    { t: "PET Bottles (15x)", v: "+8 pts", sub: "0.8 kg · K-01 · Yesterday", i: "🧴", c: "bg-blue-50", kg: "0.8kg", p: "+8" },
    { t: "Cardboard boxes", v: "+12 pts", sub: "1.2 kg · K-02 · 2 days ago", i: "📦", c: "bg-amber-50", kg: "1.2kg", p: "+12" },
    { t: "Aluminum cans (20x)", v: "+3 pts", sub: "0.3 kg · K-01 · 4 days ago", i: "🥫", c: "bg-emerald-50", kg: "0.3kg", p: "+3" },
    { t: "Mixed paper", v: "+5 pts", sub: "0.5 kg · K-03 · 1 week ago", i: "📄", c: "bg-purple-50", kg: "0.5kg", p: "+5" },
  ];
  return (
    <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
      <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
        <button type="button" onClick={() => p.go("profile")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <h2 className="text-xl font-black text-foreground flex-1">Recycling History</h2>
      </div>
      <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-20">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { l: "Total", v: `${(Number(p.currentUser.totalKg || 0) + 5.1).toFixed(1)} kg`, c: "from-primary to-emerald-600" },
            { l: "Submissions", v: `${items.length}`, c: "from-blue-500 to-cyan-600" },
            { l: "Points earned", v: `+51`, c: "from-amber-500 to-orange-600" },
          ].map(s => (
            <div key={s.l} className={`rounded-2xl p-3 bg-gradient-to-br ${s.c} text-white`}>
              <p className="text-xs font-bold opacity-80">{s.l}</p>
              <p className="text-xl font-black mt-0.5">{s.v}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-white overflow-hidden">
          {items.map((a, i) => (
            <div key={a.t} className={`flex items-center gap-3 px-4 py-3 ${i !== items.length - 1 ? "border-b border-border" : ""}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${a.c}`}>{a.i}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-foreground">{a.t}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{a.sub}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-primary">{a.v}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">{a.kg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenRedeemHistory(p: MobileAppRouterProps) {
  const [items, setItems] = useState([
    {
      id: "RD-101",
      n: "P50 GCash Load",
      pts: "500 pts",
      i: "📱",
      status: "ready",
      t: "Arrives in 24 hours",
      code: "GC-2G-9841",
      pickupLocation: "GCash Digital Distribution",
      pickupHours: "Processed within 24 Hours",
      instructions: "Credits will be transferred to your registered mobile number automatically upon verification.",
      date: "Aug 26, 2026"
    },
    {
      id: "RD-102",
      n: "5kg Rice Voucher",
      pts: "1,200 pts",
      i: "🍚",
      status: "claimed",
      t: "Redeemed at K-01",
      code: "RICE-88-1204",
      pickupLocation: "Cabantian Barangay Hall (Resource Desk)",
      pickupHours: "Mon-Fri: 8:00 AM – 5:00 PM",
      instructions: "Present this voucher code to the desk officer to collect your 5kg Premium Rice pack.",
      date: "Aug 20, 2026"
    },
    {
      id: "RD-103",
      n: "School Supplies Kit",
      pts: "800 pts",
      i: "🎒",
      status: "ready",
      t: "Pick up at Barangay Hall",
      code: "EDU-44-5920",
      pickupLocation: "Cabantian Barangay Hall (Ecology Desk)",
      pickupHours: "Mon-Fri: 8:00 AM – 5:00 PM",
      instructions: "Present your Claim Code or Resident ID (Maria Santos) at the barangay hall to claim your kit.",
      date: "Aug 25, 2026"
    },
  ]);

  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markAsClaimed = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: "claimed" } : item));
    if (selectedClaim && selectedClaim.id === id) {
      setSelectedClaim((prev: any) => prev ? { ...prev, status: "claimed" } : null);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto relative">
      <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
        <button type="button" onClick={() => p.go("profile")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <h2 className="text-xl font-black text-foreground flex-1">My Redemptions</h2>
      </div>
      <div className="p-5 space-y-3 overflow-y-auto flex-1 pb-20">
        <p className="text-xs text-muted-foreground font-semibold">Tap on any item to view claim details, pickup instructions, and voucher codes.</p>
        {items.map(h => {
          const isReady = h.status === "ready";
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => setSelectedClaim(h)}
              className={`w-full text-left rounded-2xl border transition-all p-4 flex items-start gap-4 ${
                isReady
                  ? "bg-white border-green-300 hover:border-primary hover:shadow-md cursor-pointer ring-1 ring-green-100"
                  : "bg-white/80 border-border hover:border-muted-foreground/40 cursor-pointer"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-3xl flex-shrink-0">{h.i}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-foreground">{h.n}</p>
                  {isReady && <span className="text-[10px] bg-green-50 text-green-700 font-black px-1.5 py-0.5 rounded border border-green-200">Tap to view</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{h.t} · <span className="font-mono font-bold text-foreground">{h.code}</span></p>
                <p className="text-xs font-black text-primary mt-0.5">{h.pts} spent</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isReady ? "bg-green-100 text-green-700 font-black" : "bg-muted text-muted-foreground"}`}>
                  {isReady ? "Ready to pick up" : "Claimed"}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Claim Details Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedClaim.i}</span>
                <div>
                  <h3 className="font-black text-lg text-foreground leading-tight">{selectedClaim.n}</h3>
                  <p className="text-xs text-muted-foreground">Redeemed on {selectedClaim.date} • {selectedClaim.pts}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Progress Stepper */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border">
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wide mb-3">Redemption Progress</p>
              <div className="flex items-center justify-between relative px-2">
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold"><Check className="w-4 h-4" /></div>
                  <span className="text-[10px] font-bold text-foreground">Redeemed</span>
                </div>
                <div className={`h-1 flex-1 ${selectedClaim.status === "claimed" || selectedClaim.status === "ready" ? "bg-green-500" : "bg-border"} -mx-2 mb-4`} />
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selectedClaim.status === "claimed" ? "bg-green-500 text-white" : "bg-primary text-white ring-4 ring-primary/20"}`}>
                    {selectedClaim.status === "claimed" ? <Check className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                  </div>
                  <span className="text-[10px] font-bold text-foreground">Ready to Pick</span>
                </div>
                <div className={`h-1 flex-1 ${selectedClaim.status === "claimed" ? "bg-green-500" : "bg-border"} -mx-2 mb-4`} />
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selectedClaim.status === "claimed" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                    {selectedClaim.status === "claimed" ? <Check className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">Claimed</span>
                </div>
              </div>
            </div>

            {/* Claim Code Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black text-green-800 uppercase tracking-wide">Claim / Voucher Code</p>
                <p className="text-xl font-mono font-black text-green-900 tracking-wider mt-0.5">{selectedClaim.code}</p>
              </div>
              <button
                type="button"
                onClick={() => copyCode(selectedClaim.code)}
                className="px-3.5 py-2 rounded-xl bg-white border border-green-300 text-green-800 text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-green-50 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-green-700" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Pickup Location & Hours */}
            <div className="p-4 rounded-2xl border border-border bg-white space-y-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-foreground">Pickup Location</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedClaim.pickupLocation}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 pt-2 border-t border-border">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-foreground">Operating Schedule</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedClaim.pickupHours}</p>
                </div>
              </div>
            </div>

            {/* Step-by-Step Claim Instructions */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border">
              <p className="text-xs font-black text-foreground mb-2">How to Claim Your Reward</p>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Visit the pickup location during official hours.</li>
                <li>Present your <strong>Claim Code</strong> or Resident ID to the desk officer.</li>
                <li>Verify your item and receive your reward package.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {selectedClaim.status === "ready" ? (
                <button
                  type="button"
                  onClick={() => markAsClaimed(selectedClaim.id)}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Claimed (Simulate)
                </button>
              ) : (
                <div className="flex-1 py-3 rounded-xl bg-green-100 text-green-800 text-sm font-bold text-center flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Reward Successfully Claimed
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="px-5 py-3 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type RedeemConfirmProps = MobileAppRouterProps & Readonly<{ onRedeem: () => Promise<void>; onClose: () => void }>;
function ScreenRedeemConfirm(p: RedeemConfirmProps) {
  const r = p.selectedReward!;
  const cost = r.cost ?? r.points ?? 0;
  return (
    <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto bg-white">
      <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
        <button type="button" onClick={p.onClose}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <h2 className="text-xl font-black text-foreground flex-1">Confirm Redemption</h2>
      </div>
      <div className="flex-1 flex flex-col items-center p-6 space-y-5 overflow-y-auto pb-20">
        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 border-2 border-primary/20 flex items-center justify-center text-6xl">{r.icon}</div>
        <div className="text-center">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Redeeming</p>
          <h2 className="text-2xl font-black text-foreground mt-1">{r.name}</h2>
          <p className="text-xs text-muted-foreground mt-2">{r.description ?? "Redeemable with your recycling points."}</p>
        </div>
        <div className="w-full max-w-md rounded-2xl border border-border bg-white p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Wallet className="w-5 h-5 text-primary" /></div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-semibold">Your balance</p>
            <p className="text-sm font-black text-foreground">{Number(p.currentUser.points || 0).toLocaleString()} pts</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-semibold">After</p>
            <p className="text-sm font-black text-primary">{(Number(p.currentUser.points || 0) - Number(cost)).toLocaleString()} pts</p>
          </div>
        </div>
        <div className="w-full max-w-md grid grid-cols-2 gap-3 pt-2">
          <button type="button" onClick={p.onClose} className={`py-4 ${BTN_SECONDARY_CLS} text-base`}>Cancel</button>
          <button type="button" onClick={p.onRedeem} className={`py-4 ${BTN_PRIMARY_CLS} text-base`}>Confirm · {cost} pts</button>
        </div>
      </div>
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
  const [profileUser, setProfileUser] = useState<any>(() => {
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

  const availableCities = regProvince ? Object.keys(PH_LOCATIONS[regProvince] || {}).sort(alphabeticalCompare) : [];
  const availableBarangays =
    regProvince && regCity ? (PH_LOCATIONS[regProvince]?.[regCity] || []).sort(alphabeticalCompare) : [];

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
    if (!UNPROTECTED_SCREENS.has(screen)) {
      const auth = Waste2GoodsAPI.getAuthState();
      if (!auth || !auth.isAuthenticated || !auth.token) {
        console.log("🔐 Mobile auth guard: no valid token — returning to login");
        Waste2GoodsAPI.logout();
        setScreen("login");
      }
    }
  }, [screen]);

  // Helper to get current user's display data — reactive (reads from profileUser state when set)
  const currentUser = useMemo(() => buildCurrentUser(profileUser), [profileUser]);

  // Merged leaderboard: prefer live DB rows (with correct user names from MySQL),
  // otherwise fall back to the demo placeholder list. Always returns a non-empty array
  // so the Community Leaderboard panel never appears empty.
  const mergedLeaderboard = useMemo(
    () => buildMergedLeaderboard(liveLeaderboard || null, currentUser),
    [liveLeaderboard, currentUser.id, currentUser.userId, currentUser.barangay],
  );

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
      else {
        const storedUser = Waste2GoodsAPI.getAuthState()?.user;
        if (storedUser) setProfileUser({ ...storedUser });
      }

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
      } catch (err) {
        console.warn("Leaderboard fetch failed:", err);
        if (!cancelled) setLiveLeaderboard(null);
      }
    })();
    return () => { cancelled = true; };
  }, [screen]);

  // Poll backend: is this user currently linked to a kiosk?
  // Also tick every second so the "elapsed" label in the badge refreshes in real-time
  const [kioskTick, setKioskTick] = useState(0);
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

  // Build profile update patches from current form state — extracted to keep
  // handleSaveProfile below the 15-point cognitive complexity ceiling (S3776).
  const buildProfilePatches = (): Record<string, any> => {
    const patches: Record<string, any> = {};
    if (setFName) patches.firstName = setFName;
    if (setLName) patches.lastName = setLName;
    if (setFormEmail) patches.email = setFormEmail;
    if (setPhone) patches.phone = setPhone;
    if (setProvince) patches.province = setProvince;
    if (setCity) patches.city = setCity;
    if (setBrgy) patches.barangayName = setBrgy;
    return patches;
  };

  // Perform the profile save HTTP call — supports both Waste2GoodsAPI.saveProfile
  // helper and a raw fetch fallback — extracted to keep handleSaveProfile simple.
  const saveProfileViaApiCall = async (patches: Record<string, any>): Promise<boolean> => {
    if (Waste2GoodsAPI.saveProfile) {
      return Waste2GoodsAPI.saveProfile(patches);
    }
    const userId = currentUser.id || currentUser.userId;
    const res = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${Waste2GoodsAPI.getAuthState()?.token || ""}` },
      body: JSON.stringify(patches),
    });
    return res.ok;
  };

  // Handler for the Settings "Save Changes" button — PUTs to /users/:id via core helper
  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileBanner(null);
    try {
      const patches = buildProfilePatches();
      const ok = await saveProfileViaApiCall(patches);
      if (ok) {
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


  const onLogin = async () => {
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await Waste2GoodsAPI.login(email.trim(), password);
      if (res?.user) setProfileUser({ ...res.user });
      go("home");
    } catch (err: any) {
      setLoginError(err?.message || "Invalid email or password. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const onRegisterStep1Next = () => {
    if (validateRegisterStep1({ full: regFullName, email: regEmail, phone: regPhone, pwd: regPassword, confirm: regConfirmPassword }, setRegError)) {
      setRegStep(1);
    }
  };

  const onRegisterStep2Next = () => {
    if (validateRegisterAddress({ province: regProvince, city: regCity, barangay: regBarangay }, setRegError)) {
      setRegStep(2);
    }
  };

  const onRegisterStep3MFA = async () => {
    await doRegisterSubmit(
      { full: regFullName, email: regEmail, pwd: regPassword, confirm: regConfirmPassword, phone: regPhone, province: regProvince, city: regCity, barangay: regBarangay, street: regStreetAddress },
      setRegError,
      setRegLoading,
      setProfileUser,
      setRegStep,
      go,
      "mfa"
    );
  };

  const onRegisterStep3Skip = async () => {
    await doRegisterSubmit(
      { full: regFullName, email: regEmail, pwd: regPassword, confirm: regConfirmPassword, phone: regPhone, province: regProvince, city: regCity, barangay: regBarangay, street: regStreetAddress },
      setRegError,
      setRegLoading,
      setProfileUser,
      setRegStep,
      go,
      "profile-setup"
    );
  };

  const onToggleLoginServer = () => setShowLoginServer(prev => !prev);

  const onRewardRedeem = async () => {
    if (!selectedReward) return;
    const cost = selectedReward.cost ?? selectedReward.points ?? 0;
    const newBal = Math.max(0, Number(currentUser.points || 0) - Number(cost));
    patchAuthBalance(newBal);
    setProfileUser((prev: any) => ({ ...(prev || currentUser), points: newBal, pointsBalance: newBal, redeemed: Number(currentUser.redeemed || 0) + 1 }));
    setSelectedReward(null);
    go("redeem-history");
  };

  const onRewardClose = () => setSelectedReward(null);

  const onSubmitConfirm = () => {
    const earnedPts = Math.round(Number(weight) * 10);
    const newBal = Number(currentUser.points || 0) + earnedPts;
    const newTotalKg = Number(currentUser.totalKg || 0) + Number(weight);
    patchAuthBalance(newBal);
    setProfileUser((prev: any) => ({
      ...(prev || currentUser),
      points: newBal,
      pointsBalance: newBal,
      totalKg: newTotalKg,
      submissions: Number(currentUser.submissions || 0) + 1,
    }));
    go("submit-done");
  };

  return (
    <div
      className="flex flex-col w-full bg-background"
      style={{
        background: "#f0fdf4",
        fontFamily: "'Nunito', sans-serif",
        height: "100dvh",
      }}
    >
      <MobileScreens
        screen={screen}
        leaderTab={leaderTab}
        regStep={regStep}
        selectedReward={selectedReward}
        rewardFilter={rewardFilter}
        mfaCode={mfaCode}
        weighing={weighing}
        email={email}
        password={password}
        loginError={loginError}
        loginLoading={loginLoading}
        regFullName={regFullName}
        regEmail={regEmail}
        regPassword={regPassword}
        regConfirmPassword={regConfirmPassword}
        regPhone={regPhone}
        regProvince={regProvince}
        regCity={regCity}
        regBarangay={regBarangay}
        regStreetAddress={regStreetAddress}
        regLoading={regLoading}
        regError={regError}
        profileUser={profileUser}
        profileRank={profileRank}
        profileSaving={profileSaving}
        profileBanner={profileBanner}
        setFName={setFName}
        setLName={setLName}
        setFormEmail={setFormEmail}
        setPhone={setPhone}
        setProvince={setProvince}
        setCity={setCity}
        setBrgy={setBrgy}
        showLoginServer={showLoginServer}
        loginServerBanner={loginServerBanner}
        apiHost={apiHost}
        weight={weight}
        kioskSession={kioskSession}
        kioskChecking={kioskChecking}
        mergedLeaderboard={mergedLeaderboard}
        currentUser={currentUser}
        notifItems={notifItems}
        notifUnread={notifUnread}
        rewardCategories={rewardCategories}
        filteredRewards={filteredRewards}
        profileSinceLabel={profileSinceLabel}
        availableCities={availableCities}
        availableBarangays={availableBarangays}
        mfaRefs={mfaRefs}
        setLeaderTab={setLeaderTab}
        setRegStep={setRegStep}
        setSelectedReward={setSelectedReward}
        setRewardFilter={setRewardFilter}
        setMfaCode={setMfaCode}
        setEmail={setEmail}
        setPassword={setPassword}
        setRegFullName={setRegFullName}
        setRegEmail={setRegEmail}
        setRegPassword={setRegPassword}
        setRegConfirmPassword={setRegConfirmPassword}
        setRegPhone={setRegPhone}
        setRegProvince={setRegProvince}
        setRegCity={setRegCity}
        setRegBarangay={setRegBarangay}
        setRegStreetAddress={setRegStreetAddress}
        setRegError={setRegError}
        setProfileBanner={setProfileBanner}
        setSetFName={setSetFName}
        setSetLName={setSetLName}
        setSetFormEmail={setSetFormEmail}
        setSetPhone={setSetPhone}
        setSetProvince={setSetProvince}
        setSetCity={setSetCity}
        setSetBrgy={setSetBrgy}
        setLoginServerBanner={setLoginServerBanner}
        setApiHostState={setApiHostState}
        handleSaveProfile={handleSaveProfile}
        handleDisconnectKiosk={handleDisconnectKiosk}
        onLogin={onLogin}
        onRegisterStep1Next={onRegisterStep1Next}
        onRegisterStep2Next={onRegisterStep2Next}
        onRegisterStep3MFA={onRegisterStep3MFA}
        onRegisterStep3Skip={onRegisterStep3Skip}
        onToggleLoginServer={onToggleLoginServer}
        onRewardRedeem={onRewardRedeem}
        onRewardClose={onRewardClose}
        onSubmitConfirm={onSubmitConfirm}
        go={go}
      />
    </div>
  );
}
