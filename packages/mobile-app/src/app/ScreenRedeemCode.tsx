import { useState } from "react";
import { Waste2GoodsAPI } from "@waste2goods/core";
import { ArrowLeft, AlertCircle, CheckCircle2, Hash, Info, Recycle, Sparkles } from "lucide-react";

type ClaimResult = { newBalance: number; pointsAwarded: number; bottles: number };

type Props = Readonly<{
  go: (s: "home") => void;
  onClaimed: (r: ClaimResult) => void;
}>;

const CODE_LENGTH = 8;

// Receipt codes are 8 letters/digits. Accept lowercase, spaces and dashes when typing or pasting.
function cleanCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
}

export default function ScreenRedeemCode({ go, onClaimed }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ClaimResult | null>(null);

  const ready = code.length === CODE_LENGTH;

  const submit = async () => {
    if (!ready || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await Waste2GoodsAPI.claimMachineCode(code);
      const r: ClaimResult = {
        newBalance: Number(res.newBalance),
        pointsAwarded: Number(res.pointsAwarded),
        bottles: Number(res.bottles),
      };
      setResult(r);
      onClaimed(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not redeem the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCode("");
    setError("");
    setResult(null);
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto"
      style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}
    >
      <div
        className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border"
        style={{ top: "var(--sat)" }}
      >
        <button type="button" onClick={() => go("home")}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h2 className="text-base font-black text-foreground">Redeem Receipt Code</h2>
          <p className="text-xs text-muted-foreground">Turn your bottle receipt into points</p>
        </div>
      </div>

      {result ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6 overflow-y-auto">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-14 h-14 text-green-500" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-primary border-4 border-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-foreground">Points Added!</h2>
            <p className="text-5xl font-black text-primary tracking-tight">+{result.pointsAwarded} pts</p>
            <p className="text-muted-foreground text-sm mt-2">
              {result.bottles} bottle{result.bottles === 1 ? "" : "s"} recycled. Thank you!
            </p>
          </div>
          <div className="w-full max-w-md space-y-3">
            <div className="rounded-2xl border border-border bg-white p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <Recycle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">New balance</p>
                <p className="font-black text-foreground">{result.newBalance.toLocaleString()} total points</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => go("home")}
              className="w-full py-4 rounded-2xl bg-primary text-white font-black hover:bg-green-700 transition-colors text-base"
            >
              Back to Home
            </button>
            <button
              type="button"
              onClick={reset}
              className="w-full py-3 rounded-2xl border border-border font-bold text-foreground hover:bg-secondary transition-colors text-sm"
            >
              Redeem another code
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="rounded-2xl border border-border bg-white p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-sm text-foreground">Enter your receipt code</p>
                <p className="text-xs text-muted-foreground">8 letters or numbers, printed on your receipt</p>
              </div>
            </div>

            <input
              value={code}
              onChange={(e) => {
                setCode(cleanCode(e.target.value));
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="ABCD2345"
              maxLength={CODE_LENGTH}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Receipt code"
              className="w-full px-4 py-4 rounded-xl border border-border bg-white text-center font-mono font-black text-2xl tracking-[0.3em] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              disabled={!ready || loading}
              onClick={submit}
              className="w-full py-4 rounded-2xl bg-primary text-white font-black hover:bg-green-700 transition-colors text-base disabled:opacity-50"
            >
              {loading ? "Redeeming..." : "Redeem Points"}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex gap-2.5">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 font-semibold leading-relaxed">
              Each receipt code works only once. Points are added to your account right away.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}