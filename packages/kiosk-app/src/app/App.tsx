
import { useState, useEffect } from "react";
import {
  Recycle, QrCode, Wifi, Clock, Battery, CheckCircle, Trophy, Scale,
  Check, Lock, Mail, ArrowLeft, LogIn, Smartphone, X, AlertCircle
} from "lucide-react";
import { Waste2GoodsAPI, KIOSK_PIN } from "@waste2goods/core";

type KioskScreen =
  | "idle"
  | "welcome"
  | "manual-login"
  | "scanning"
  | "deposit"
  | "weighing"
  | "confirm"
  | "done";

type ConnectedUser = {
  name: string;
  balance: number;
  id: string;
};

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

const QR_BRIDGE_KEY = "w2g_kiosk_qr_bridge";

const MATERIAL_PTS_PER_KG: Record<string, number> = {
  "Metal Cans": 80,
  "PET Plastic": 50,
  "Cardboard": 30,
};
const DEFAULT_MATERIAL_PTS = 25;
const BADGE_SUCCESS_CLS = "bg-green-100 text-green-700";
const BADGE_WARN_CLS = "bg-amber-100 text-amber-700";
const BTN_PRIMARY_CLS = "rounded-2xl bg-green-500 text-white font-black hover:bg-green-400 transition-all";
const BTN_SECONDARY_CLS = "rounded-2xl border border-white/20 text-white/70 font-semibold hover:bg-white/5 transition-colors";

function pickDemoUserFromList(list: any[]): ConnectedUser | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  const match = list.find(u => (u as any).email === "dmcb@gmail.com")
    || list.find(u => (u as any).userId === "U-002")
    || list[0];
  return {
    name: match.name || `${match.firstName || ""} ${match.lastName || ""}`.trim() || "dm cb",
    balance: Number(match.points ?? match.pointsBalance ?? 50),
    id: match.id || match.userId || "U-002",
  };
}

function buildLinkedUserFromAuth(authUser: any): ConnectedUser {
  return {
    name: authUser?.name || `${authUser?.firstName || ""} ${authUser?.lastName || ""}`.trim() || "User",
    balance: Number(authUser?.points || authUser?.pointsBalance || 0),
    id: authUser?.id || authUser?.userId || "U-000",
  };
}

function buildConnectedUserFromParsed(parsed: any): ConnectedUser {
  return buildLinkedUserFromAuth(parsed?.user);
}

function getMaterialIdByType(type: string): number {
  if (type === "Metal Cans") return 2;
  if (type === "Cardboard") return 3;
  return 1;
}

function processBridgeData(raw: any): { linked: ConnectedUser; kioskId: string } | null {
  if (!raw || !raw.user || !raw.timestamp) return null;
  if (Date.now() - raw.timestamp >= 60000) return null;
  const linked = buildConnectedUserFromParsed(raw);
  const kioskId = raw.kioskPayload?.includes?.("K-") ? raw.kioskPayload : "K-01";
  return { linked, kioskId };
}

async function handleSimulateScanInternal(connect: (u: ConnectedUser) => void, go: (s: KioskScreen) => void) {
  let userToConnect: ConnectedUser;
  try {
    const list = await Waste2GoodsAPI.getUsers();
    const userFromList = pickDemoUserFromList(list);
    userToConnect = userFromList || { name: "dm cb", balance: 50, id: "U-002" };
  } catch {
    userToConnect = { name: "dm cb", balance: 50, id: "U-002" };
  }
  connect(userToConnect);
  go("deposit");
}

async function handleManualLoginInternal(
  email: string,
  password: string,
  setError: (s: string) => void,
  setLoading: (b: boolean) => void,
): Promise<{ linked: ConnectedUser } | null> {
  if (!email || !password) {
    setError("Please enter email and password");
    return null;
  }
  try {
    setLoading(true);
    const auth = await Waste2GoodsAPI.login(email, password);
    setLoading(false);
    if (!auth?.user) {
      setError("Invalid credentials");
      return null;
    }
    const linked = buildLinkedUserFromAuth(auth.user);
    return { linked };
  } catch (e) {
    setLoading(false);
    setError(e instanceof Error ? e.message : "Login failed");
    return null;
  }
}

function startFlowInternal(
  connectedUser: ConnectedUser | null,
  go: (s: KioskScreen) => void,
) {
  if (!connectedUser) {
    go("idle");
    return;
  }
  go("scanning");
  setTimeout(() => {
    if (connectedUser) go("deposit");
  }, 2500);
}

export default function App() {
  const [ks, setKs] = useState<KioskScreen>("idle");
  const [selectedType, setSelectedType] = useState("PET Plastic");
  const [weighing, setWeighing] = useState(false);
  const weight = useAnimatedWeight(2.3, weighing);

  const [connectedUser, setConnectedUser] = useState<ConnectedUser | null>(null);
  const [manualEmail, setManualEmail] = useState("");
  const [manualPassword, setManualPassword] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");
  const [balanceAfterEarn, setBalanceAfterEarn] = useState(0);

  const go = (s: KioskScreen) => setKs(s);

  const connectKioskUser = (u: ConnectedUser, kioskId = "K-01") => {
    setConnectedUser(u);
    setBalanceAfterEarn(u.balance);
    Waste2GoodsAPI.connectKioskSession?.({ userId: u.id, userName: u.name, kioskId });
  };

  // Demo: Simulate Scan — actually fetches a real user from the DB via backend
  // (acts as if user scanned with their phone, so kiosk "shows user dashboard" based on actual DB user
  const handleSimulateScan = async () =>
    handleSimulateScanInternal(u => connectKioskUser(u), go);

  const startWeigh = () => {
    setKs("weighing");
    setWeighing(false);
    setTimeout(() => setWeighing(true), 500);
    setTimeout(() => setKs("confirm"), 4500);
  };

  const pts = Math.round(weight * (MATERIAL_PTS_PER_KG[selectedType] ?? DEFAULT_MATERIAL_PTS));

  const handleConfirmDone = async () => {
    const w = weight > 0 ? weight : 2.3;
    if (connectedUser?.id) {
      try {
        await Waste2GoodsAPI.createTransaction({
          userId: connectedUser.id,
          materialId: getMaterialIdByType(selectedType),
          weightKg: w,
          kioskId: "K-01"
        });
      } catch (err) {
        console.warn("Transaction DB submission failed:", err);
      }
    }
    setBalanceAfterEarn((connectedUser?.balance || 0) + pts);
    setKs("done");
  };

  // QR <-> Kiosk bridge: listen for mobile scan events
  useEffect(() => {
    const checkBridge = () => {
      try {
        const data = localStorage.getItem(QR_BRIDGE_KEY);
        if (!data) return;
        const parsed = JSON.parse(data);
        if (!parsed || !parsed.user || !parsed.timestamp) return;
        if (Date.now() - parsed.timestamp >= 60000) return;
        const linked = buildConnectedUserFromParsed(parsed);
        setConnectedUser(linked);
        setBalanceAfterEarn(linked.balance);
        localStorage.removeItem(QR_BRIDGE_KEY);
        Waste2GoodsAPI.connectKioskSession?.({
          userId: linked.id,
          userName: linked.name,
          kioskId: parsed.kioskPayload?.includes?.("K-") ? parsed.kioskPayload : "K-01",
        });
        setKs("deposit");
      } catch {}
    };
    checkBridge();
    const iv = setInterval(checkBridge, 800);
    const onStorage = (e: StorageEvent) => {
      if (e.key === QR_BRIDGE_KEY) checkBridge();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(iv);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Keep backend session alive while a resident is linked to this kiosk
  useEffect(() => {
    if (!connectedUser?.id) return;
    Waste2GoodsAPI.connectKioskSession?.({
      userId: connectedUser.id,
      userName: connectedUser.name,
      kioskId: "K-01",
    });
    const pingIv = setInterval(() => {
      Waste2GoodsAPI.pingKioskSession?.(connectedUser.id);
    }, 30000);
    return () => clearInterval(pingIv);
  }, [connectedUser?.id, connectedUser?.name]);

  const startFlow = () => {
    if (!connectedUser) {
      setKs("idle");
      return;
    }
    setKs("scanning");
    setTimeout(() => {
      if (connectedUser) {
        setKs("deposit");
      }
    }, 2500);
  };

  const handleManualLogin = async () => {
    setManualError("");
    if (!manualEmail || !manualPassword) {
      setManualError("Please enter email and password");
      return;
    }
    try {
      setManualLoading(true);
      const auth = await Waste2GoodsAPI.login(manualEmail, manualPassword);
      setManualLoading(false);
      if (!auth?.user) {
        setManualError("Invalid credentials");
        return;
      }
      const linked = buildLinkedUserFromAuth(auth.user);
      setConnectedUser(linked);
      setBalanceAfterEarn(linked.balance);
      Waste2GoodsAPI.connectKioskSession?.({
        userId: linked.id,
        userName: linked.name,
        kioskId: "K-01",
      });
      setManualEmail("");
      setManualPassword("");
      go("deposit");
    } catch (e) {
      setManualLoading(false);
      setManualError(e instanceof Error ? e.message : "Login failed");
    }
  };

  const handleResetKiosk = () => {
    if (connectedUser?.id) {
      Waste2GoodsAPI.disconnectKioskSession?.(connectedUser.id);
    }
    setConnectedUser(null);
    setSelectedType("PET Plastic");
    setWeighing(false);
    go("welcome");
  };

  const renderWelcome = () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center px-8 py-4 overflow-auto">
      <div className="relative flex-shrink-0">
        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
          <Recycle className="w-8 h-8 text-green-400" />
        </div>
      </div>
      <div className="flex-shrink-0">
        <h1 className="text-4xl font-black text-white tracking-tight mb-2" style={{ textShadow: "0 0 40px rgba(74,222,128,0.2)" }}>
          Welcome to Waste2Goods
        </h1>
        <p className="text-green-300 text-base max-w-2xl mx-auto leading-relaxed">
          Sign in to submit your recyclables and earn rewards points instantly!
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-xl pt-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => go("idle")}
          className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-white/8 border border-white/15 hover:bg-white/15 hover:border-green-400/40 transition-all group"
        >
          <div className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-400/30 flex items-center justify-center group-hover:scale-105 transition-transform">
            <QrCode className="w-7 h-7 text-green-400" />
          </div>
          <div>
            <p className="text-white font-black text-base">Scan QR Code</p>
            <p className="text-green-300 text-xs mt-0.5">Use Waste2Goods mobile app</p>
          </div>
          <div className="flex items-center gap-2 mt-0.5 px-3 py-1.5 rounded-xl bg-green-500/10 text-green-300 text-xs font-bold">
            <Smartphone className="w-3.5 h-3.5" />
            Mobile App
          </div>
        </button>

        <button
          type="button"
          onClick={() => go("manual-login")}
          className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-white/8 border border-white/15 hover:bg-white/15 hover:border-blue-400/40 transition-all group"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center group-hover:scale-105 transition-transform">
            <LogIn className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <p className="text-white font-black text-base">Manual Sign In</p>
            <p className="text-green-300 text-xs mt-0.5">Use email &amp; password</p>
          </div>
          <div className="flex items-center gap-2 mt-0.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-300 text-xs font-bold">
            <Mail className="w-3.5 h-3.5" />
            Email Login
          </div>
        </button>
      </div>

      <div className="flex gap-4 pt-1 flex-shrink-0">
        {[["♻️", "PET Plastic", "50 pts/kg"]].map(([e, l, p]) => (
          <div
            key={String(l)}
            className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10"
          >
            <span className="text-xl">{String(e)}</span>
            <span className="text-xs text-white font-semibold">{String(l)}</span>
            <span className="text-xs text-green-400 font-bold">{String(p)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderIdle = () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center px-10 py-4 overflow-auto">
      <div className="relative flex-shrink-0">
        <div className="w-32 h-32 rounded-3xl bg-white p-2 border border-white/15 flex items-center justify-center" style={{ boxShadow: "0 0 80px rgba(22,163,74,0.25)" }}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
              JSON.stringify({ kioskId: "K-01", action: "signin", ts: Date.now() })
            )}`}
            alt="QR Code"
            className="w-full h-full"
          />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-400 border-2 border-green-900 flex items-center justify-center animate-pulse">
          <Wifi className="w-3 h-3 text-green-900" />
        </div>
      </div>
      <div className="flex-shrink-0">
        <h1 className="text-4xl font-black text-white tracking-tight mb-2" style={{ textShadow: "0 0 40px rgba(74,222,128,0.2)" }}>
          Scan to Sign In
        </h1>
        <p className="text-green-300 text-sm max-w-md mx-auto leading-relaxed">
          Open the Waste2Goods app, tap <strong className="text-white">Submit Recyclables</strong>, and scan this screen to begin.
        </p>
      </div>
      <div className="flex gap-4 flex-shrink-0">
        {[["♻️", "PET Plastic", "50 pts/kg"]].map(([e, l, p]) => (
          <div
            key={String(l)}
            className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10"
          >
            <span className="text-xl">{String(e)}</span>
            <span className="text-xs text-white font-semibold">{String(l)}</span>
            <span className="text-xs text-green-400 font-bold">{String(p)}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-1 flex-wrap justify-center flex-shrink-0">
        <button
          type="button"
          onClick={() => go("welcome")}
          className="px-5 py-2.5 rounded-2xl border border-white/20 text-white/70 text-sm font-semibold hover:bg-white/5 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={handleSimulateScan}
          className="px-8 py-3 rounded-2xl bg-green-500 text-white font-black text-base hover:bg-green-400 transition-all flex-shrink-0"
          style={{ boxShadow: "0 0 40px rgba(74,222,128,0.3)" }}
        >
          Demo: Simulate Scan
        </button>
      </div>
    </div>
  );

  const renderManualLogin = () => (
    <div className="w-full max-w-md">
      <div className="rounded-3xl bg-white/8 border border-white/15 p-8 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Manual Sign In</h2>
            <p className="text-green-300 text-sm">Enter your credentials to continue</p>
          </div>
          <button
            onClick={() => { setManualError(""); go("welcome"); }}
            className="p-2 rounded-xl border border-white/15 text-white/70 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-black text-green-300 uppercase tracking-wide mb-1.5 block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-green-400/70" />
              <input
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualLogin()}
                placeholder="you@email.com"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400/40 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-green-300 uppercase tracking-wide mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-green-400/70" />
              <input
                type="password"
                value={manualPassword}
                onChange={(e) => setManualPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualLogin()}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400/40 transition-all"
              />
            </div>
          </div>

          {manualError && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-400/30 text-red-300 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-xs font-semibold leading-snug">{manualError}</span>
            </div>
          )}

          <button
            onClick={handleManualLogin}
            disabled={manualLoading}
            className="w-full py-4 rounded-2xl bg-green-500 text-white font-black text-base hover:bg-green-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ boxShadow: "0 0 30px rgba(74,222,128,0.25)" }}
          >
            {manualLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/50 font-semibold">DEMO</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="space-y-1.5 text-center">
            <p className="text-xs text-white/50">
              Demo resident: <span className="text-green-300 font-bold">resident@cabantian.ph</span>
            </p>
            <p className="text-xs text-white/50">
              Demo admin: <span className="text-green-300 font-bold">admin@waste2goods.ph</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => { setManualError(""); go("idle"); }}
          className="w-full mt-6 py-3 rounded-xl text-green-300 text-xs font-bold hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <QrCode className="w-4 h-4" />
          Or sign in with QR code instead
        </button>
      </div>
    </div>
  );

  const renderScanning = () => (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="relative w-40 h-40">
        <div className="absolute inset-0 rounded-3xl border-2 border-green-400/30 animate-ping" style={{ animationDuration: "1.5s" }} />
        <div className="absolute inset-4 rounded-2xl border-2 border-green-400/60 animate-ping" style={{ animationDuration: "1.8s", animationDelay: "0.3s" }} />
        <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-green-400 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-green-400 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-green-400 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-green-400 rounded-br-xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <QrCode className="w-16 h-16 text-green-400/60" />
        </div>
      </div>
      <div>
        <h2 className="text-4xl font-black text-white mb-2">Authenticating...</h2>
        <p className="text-green-300">Verifying resident identity</p>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-green-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );

  const renderDeposit = () => {
    if (!connectedUser) {
      setTimeout(() => setKs("idle"), 100);
      return null;
    }
    const user = connectedUser;
    return (
      <div className="w-full flex gap-8 items-center">
        <div className="flex-1 space-y-4">
          <div className="rounded-2xl bg-white/8 border border-white/15 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-400/20 border border-green-400/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black truncate">
                  {user.name} — verified
                </p>
                <p className="text-green-300 text-xs">
                  Cabantian · Balance: {user.balance.toLocaleString()} pts
                </p>
              </div>
              <button
                onClick={handleResetKiosk}
                className="text-xs text-white/50 hover:text-white/80 font-semibold underline underline-offset-2"
              >
                Switch user
              </button>
            </div>
            <div>
              <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2">
                Select Recyclable Type
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[["♻️", "PET Plastic"]].map(([e, l]) => (
                  <button
                    key={String(l)}
                    onClick={() => setSelectedType(String(l))}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      selectedType === String(l)
                        ? "border-green-400 bg-green-400/10 text-green-300"
                        : "border-white/15 bg-white/5 text-white/60 hover:border-white/30"
                    }`}
                  >
                    <span className="text-xl">{String(e)}</span>
                    {String(l)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">
              Deposit Instructions
            </p>
            <ol className="space-y-2">
              {[
                "Open the collection bin door below",
                "Place your recyclables inside",
                "Close the door securely",
                "Wait for the scale to stabilize",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="flex flex-col items-center gap-5 w-56">
          <div className="text-center">
            <p className="text-green-300 text-sm mb-2">Ready to weigh</p>
            <div className="text-6xl mb-3">⬇️</div>
            <p className="text-white/70 text-xs text-center">Place items in the bin then tap below</p>
          </div>
          <button
            onClick={startWeigh}
            className="w-full py-4 rounded-2xl bg-green-500 text-white font-black text-lg hover:bg-green-400 transition-all"
            style={{ boxShadow: "0 0 30px rgba(74,222,128,0.25)" }}
          >
            Start Weighing
          </button>
        </div>
      </div>
    );
  };

  const renderWeighing = () => {
    if (!connectedUser) {
      setTimeout(() => setKs("idle"), 100);
      return null;
    }
    const user = connectedUser;
    return (
      <div className="w-full flex gap-10 items-center">
        <div className="flex flex-col items-center gap-4 flex-shrink-0">
          <p className="text-green-300 text-sm font-bold uppercase tracking-widest">
            Live Weight
          </p>
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="8"
              />
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="#16a34a"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - Math.min(1, weight / 5))}`}
                style={{ transition: "stroke-dashoffset 0.3s ease" }}
              />
            </svg>
            <div className="text-center z-10">
              <Scale className="w-6 h-6 text-green-400 mx-auto mb-1" />
              <span className="text-5xl font-black text-white">{weight.toFixed(1)}</span>
              <p className="text-green-300 font-bold text-lg">kg</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-300 text-xs font-semibold">
              Measuring {selectedType}...
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div className="rounded-2xl bg-white/8 border border-white/15 p-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Resident", user.name],
                ["Type", selectedType],
                ["Rate", (MATERIAL_PTS_PER_KG[selectedType] ?? DEFAULT_MATERIAL_PTS) + " pts/kg"],
                ["Kiosk", "K-01"],
              ].map(([l, v]) => (
                <div key={String(l)} className="rounded-xl bg-white/5 p-3">
                  <p className="text-green-400 text-xs font-bold">{l}</p>
                  <p className="text-white font-black text-sm mt-0.5 truncate">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-green-500/10 border border-green-400/20 p-5 text-center">
            <p className="text-green-300 text-sm mb-1">Estimated Points</p>
            <p className="text-6xl font-black text-green-400">+{pts}</p>
            <p className="text-green-300 text-sm mt-1">pts</p>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirm = () => {
    if (!connectedUser) {
      setTimeout(() => setKs("idle"), 100);
      return null;
    }
    const user = connectedUser;
    const newBalance = user.balance + pts;
    return (
      <div className="w-full flex gap-8 items-center">
        <div className="flex-1 space-y-4">
          <div className="rounded-2xl bg-white/8 border border-white/15 p-5 space-y-3">
            <h3 className="text-white font-black text-lg">Submission Summary</h3>
            <div className="space-y-2 text-sm">
              {[
                ["Resident", user.name],
                ["Recyclable Type", selectedType],
                ["Weight Measured", "2.30 kg"],
                ["Rate", "50 pts/kg"],
                ["Kiosk", "K-01 · Cabantian Hall"],
                ["Timestamp", "Jun 17, 2026 · 9:41 AM"],
              ].map(([l, v]) => (
                <div
                  key={String(l)}
                  className="flex justify-between border-b border-white/8 pb-1.5 last:border-0 last:pb-0"
                >
                  <span className="text-green-300 font-semibold">{l}</span>
                  <span className="text-white font-bold truncate ml-4">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/15">
              <span className="text-green-300 font-black text-base">Points to Award</span>
              <span className="text-green-400 font-black text-3xl">+115 pts</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-56 flex-shrink-0">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
            <p className="text-green-300 text-xs font-semibold mb-1">New Balance</p>
            <p className="text-3xl font-black text-white">{newBalance.toLocaleString()}</p>
            <p className="text-green-400 text-sm font-bold">pts</p>
          </div>
          <button
            onClick={handleConfirmDone}
            className="w-full py-4 rounded-2xl bg-green-500 text-white font-black text-lg hover:bg-green-400 transition-all"
            style={{ boxShadow: "0 0 30px rgba(74,222,128,0.25)" }}
          >
            Confirm ✓
          </button>
          <button
            onClick={() => setKs("idle")}
            className="w-full py-2.5 rounded-2xl border border-white/20 text-white/60 text-sm font-semibold hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderDone = () => {
    if (!connectedUser) {
      setTimeout(() => setKs("idle"), 100);
      return null;
    }
    const user = connectedUser;
    const finalName = user.name;
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <div
            className="w-24 h-24 rounded-full bg-green-400/20 border-4 border-green-400 flex items-center justify-center"
            style={{ boxShadow: "0 0 80px rgba(74,222,128,0.4)" }}
          >
            <Check className="w-12 h-12 text-green-400" />
          </div>
          <div className="absolute -top-4 -right-4 text-4xl animate-bounce">🎉</div>
        </div>
        <div>
          <h2 className="text-5xl font-black text-white mb-2">Salamat, {finalName.split(" ")[0]}!</h2>
          <p className="text-green-300 text-lg">
            Your submission has been recorded and points awarded.
          </p>
        </div>
        <div
          className="rounded-3xl bg-primary/20 border border-primary/40 p-6 w-full max-w-md"
          style={{ boxShadow: "0 0 50px rgba(22,163,74,0.3)" }}
        >
          <p className="text-green-300 text-xs font-bold uppercase tracking-widest mb-1">
            New Points Balance
          </p>
          <p className="text-6xl font-black text-white">{balanceAfterEarn.toLocaleString()}</p>
          <p className="text-green-400 text-xl font-bold">pts</p>
        </div>
        <div className="flex gap-4">
          {[
            ["Weight", "2.3 kg", "text-white", "bg-white/10"],
            [
              "Points Earned",
              "+115 pts",
              "text-green-400",
              "bg-green-500/15 border-green-400/30",
            ],
          ].map(([l, v, tc, bg]) => (
            <div
              key={String(l)}
              className={`px-5 py-3 rounded-2xl ${bg} border border-white/15 text-center`}
            >
              <p className="text-green-300 text-xs font-bold uppercase tracking-widest mb-1">
                {l}
              </p>
              <p className={`text-xl font-black ${tc}`}>{v}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
          <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-white text-sm font-semibold">
            You moved to <strong className="text-yellow-300">#3</strong> on this week's leaderboard! 🏆
            Keep recycling!
          </p>
        </div>
        <button
          onClick={handleResetKiosk}
          className="text-sm text-green-400 font-semibold hover:text-green-300 transition-colors underline underline-offset-4 pt-2"
        >
          Tap here to return to main screen
        </button>
      </div>
    );
  };

  const renderScreen = () => {
    switch (ks) {
      case "welcome":
        return renderWelcome();
      case "idle":
        return renderIdle();
      case "manual-login":
        return renderManualLogin();
      case "scanning":
        return renderScanning();
      case "deposit":
        return renderDeposit();
      case "weighing":
        return renderWeighing();
      case "confirm":
        return renderConfirm();
      case "done":
        return renderDone();
      default:
        return renderWelcome();
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-8"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Kiosk display */}
      <div
        className="relative overflow-hidden"
        style={{
          width: 900,
          height: 560,
          background: "linear-gradient(135deg, #042318 0%, #0a3d1f 40%, #0c3547 100%)",
          borderRadius: 20,
          border: "3px solid rgba(255,255,255,0.08)",
          boxShadow: "0 50px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Scanline texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 4px)",
          }}
        />
        {/* Glow orb */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #16a34a, transparent)" }}
        />

        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 px-8 py-3 flex items-center justify-between border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <Recycle className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-white font-black text-sm leading-none">Waste2Goods</p>
              <p className="text-green-400 text-xs">K-01 · Cabantian Hall</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs text-green-300">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5" />
              <span>Connected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5" />
              <span>94%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>9:41 AM · Jun 17, 2026</span>
            </div>
          </div>
        </div>

        {/* Content area — absolute inside kiosk frame, avoids overlap with status bar */}
        <div className="absolute top-14 left-0 right-0 bottom-0 flex items-center justify-center overflow-hidden px-5 pb-3">
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            {renderScreen()}
          </div>
        </div>
      </div>
    </div>
  );
}
