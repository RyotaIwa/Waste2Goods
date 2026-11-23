import { useState } from "react";
import {
  Recycle, Wifi, Clock, Battery, CheckCircle, XCircle, Hash, Loader2, Lock,
} from "lucide-react";
import { Waste2GoodsAPI } from "@waste2goods/core";

type ClaimResult =
  | { status: "ok"; rewardName: string; residentName: string }
  | { status: "error"; message: string };

const CODE_LENGTH = 8;

// Pickup codes are 8 letters/digits. Accept lowercase and strip anything else while typing.
function cleanCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
}

async function verifyCode(
  code: string,
  setChecking: (b: boolean) => void,
  setResult: (r: ClaimResult | null) => void,
  onAuthLost: () => void,
) {
  setChecking(true);
  try {
    const res = await Waste2GoodsAPI.claimRedemptionCode(code);
    setResult({ status: "ok", rewardName: res.rewardName || "Reward", residentName: res.residentName || "Resident" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not verify the code";
    // The kiosk login token is short-lived; if it lapsed, ask for the PIN again instead of showing a confusing error.
    if (/401|403|unauthor|forbidden|token|expired|sign in/i.test(message)) {
      Waste2GoodsAPI.logout();
      onAuthLost();
      return;
    }
    setResult({ status: "error", message });
  } finally {
    setChecking(false);
  }
}

function isKioskSignedIn(): boolean {
  const auth = Waste2GoodsAPI.getAuthState();
  const role = String((auth?.user as any)?.role || "").toLowerCase();
  return Boolean(auth?.token && (role === "kiosk" || role === "admin" || role === "super_admin"));
}

function PinGate({ onUnlocked }: Readonly<{ onUnlocked: () => void }>) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    if (!pin || busy) return;
    setBusy(true);
    setError("");
    try {
      await Waste2GoodsAPI.kioskLogin(pin);
      if (!isKioskSignedIn()) throw new Error("Invalid PIN");
      onUnlocked();
    } catch {
      setError("Invalid PIN. Ask the barangay admin.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col items-center gap-6 text-center w-full max-w-sm">
      <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
        <Lock className="w-8 h-8 text-green-400" />
      </div>
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Staff Sign-in</h1>
        <p className="text-green-300 text-sm">Enter the kiosk PIN to start verifying reward pickups.</p>
      </div>
      <input
        type="password"
        inputMode="numeric"
        value={pin}
        onChange={(e) => { setPin(e.target.value); setError(""); }}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="PIN"
        aria-label="Kiosk PIN"
        className="w-full px-4 py-4 rounded-2xl border border-white/15 bg-white/5 text-center font-mono font-black text-2xl tracking-[0.4em] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-400/40"
      />
      {error && <p className="text-red-300 text-sm font-semibold">{error}</p>}
      <button
        type="button"
        disabled={!pin || busy}
        onClick={submit}
        className="w-full py-4 rounded-2xl bg-green-500 text-white font-black text-lg hover:bg-green-400 transition-all disabled:opacity-50"
      >
        {busy ? "Checking..." : "Unlock"}
      </button>
    </div>
  );
}

function IdleTerminal({
  code,
  setCode,
  checking,
  onVerify,
}: Readonly<{
  code: string;
  setCode: (s: string) => void;
  checking: boolean;
  onVerify: () => void;
}>) {
  const ready = code.length === CODE_LENGTH;
  return (
    <div className="flex flex-col items-center gap-6 text-center w-full max-w-md">
      <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
        <Hash className="w-8 h-8 text-green-400" />
      </div>
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Reward Pickup</h1>
        <p className="text-green-300 text-sm max-w-sm mx-auto leading-relaxed">
          Enter the pickup code shown in the resident's "My Redemptions" screen to verify and hand over the reward.
        </p>
      </div>
      <input
        value={code}
        onChange={(e) => setCode(cleanCode(e.target.value))}
        onKeyDown={(e) => e.key === "Enter" && ready && !checking && onVerify()}
        placeholder="ABCD2345"
        maxLength={CODE_LENGTH}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Pickup code"
        className="w-full px-4 py-5 rounded-2xl border border-white/15 bg-white/5 text-center font-mono font-black text-3xl tracking-[0.3em] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-400/40"
      />
      <button
        type="button"
        disabled={!ready || checking}
        onClick={onVerify}
        className="w-full py-4 rounded-2xl bg-green-500 text-white font-black text-lg hover:bg-green-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ boxShadow: "0 0 30px rgba(74,222,128,0.25)" }}
      >
        {checking ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify Code"
        )}
      </button>
    </div>
  );
}

function ResultTerminal({ result, onReset }: Readonly<{ result: ClaimResult; onReset: () => void }>) {
  if (result.status === "ok") {
    return (
      <div className="flex flex-col items-center gap-6 text-center w-full max-w-md">
        <div
          className="w-24 h-24 rounded-full bg-green-400/20 border-4 border-green-400 flex items-center justify-center"
          style={{ boxShadow: "0 0 80px rgba(74,222,128,0.4)" }}
        >
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>
        <div>
          <h2 className="text-4xl font-black text-white mb-2">Valid — Claimed</h2>
          <p className="text-green-300 text-lg">{result.rewardName}</p>
          <p className="text-white/70 text-sm mt-1">Resident: {result.residentName}</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-4 rounded-2xl bg-green-500 text-white font-black text-lg hover:bg-green-400 transition-all"
          style={{ boxShadow: "0 0 30px rgba(74,222,128,0.25)" }}
        >
          Next Resident
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-6 text-center w-full max-w-md">
      <div className="w-24 h-24 rounded-full bg-red-400/20 border-4 border-red-400 flex items-center justify-center">
        <XCircle className="w-12 h-12 text-red-400" />
      </div>
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Not Valid</h2>
        <p className="text-red-300 text-sm">{result.message}</p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="w-full py-4 rounded-2xl border border-white/20 text-white font-black text-lg hover:bg-white/5 transition-all"
      >
        Try Again
      </button>
    </div>
  );
}

export default function App() {
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [signedIn, setSignedIn] = useState<boolean>(isKioskSignedIn());

  const onVerify = async () => {
    await verifyCode(code, setChecking, setResult, () => setSignedIn(false));
  };
  const onReset = () => {
    setCode("");
    setResult(null);
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
              <p className="text-green-400 text-xs">Reward Pickup Terminal · Cabantian Hall</p>
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
              <span>{new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="absolute top-14 left-0 right-0 bottom-0 flex items-center justify-center overflow-hidden px-5 pb-3">
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            {!signedIn ? <PinGate onUnlocked={() => setSignedIn(true)} /> : result ? <ResultTerminal result={result} onReset={onReset} /> : (
              <IdleTerminal code={code} setCode={setCode} checking={checking} onVerify={onVerify} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
