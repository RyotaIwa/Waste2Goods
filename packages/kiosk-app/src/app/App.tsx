
import { useState, useEffect } from "react";
import { Recycle, QrCode, Wifi, Clock, Battery, CheckCircle, Trophy, Scale, Check, Lock, AlertTriangle, LogOut } from "lucide-react";
import { Waste2GoodsAPI, KIOSK_PIN } from "@waste2goods/core";

type KioskScreen = "login" | "idle" | "scanning" | "deposit" | "weighing" | "confirm" | "done";

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

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin(pin + num);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await Waste2GoodsAPI.kioskLogin(pin);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setTimeout(() => setPin(""), 1000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pin.length === 4 && !loading) {
      handleSubmit();
    }
  }, [pin]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-10">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-green-400/20 border-2 border-green-400/40 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-5xl font-black text-white mb-3">Kiosk Access</h1>
        <p className="text-green-300 text-lg">Enter your 4-digit PIN to activate</p>
      </div>

      <div className="flex gap-4 mb-5">
        {[0,1,2,3].map(i => (
          <div key={i} className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${pin.length > i ? "border-green-400 bg-green-400/10" : "border-white/20 bg-white/5"}`}>
            <div className={`w-5 h-5 rounded-full transition-all ${pin.length > i ? "bg-green-400" : "bg-white/20"}`} />
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/30 text-red-300 px-5 py-3 rounded-xl">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 w-72">
        {[1,2,3,4,5,6,7,8,9,null,0,"del"].map((num, i) => (
          <button
            key={i}
            onClick={() => num === "del" ? handleDelete() : num !== null && handleKeyPress(num.toString())}
            disabled={num === null}
            className={`h-16 rounded-2xl text-2xl font-bold transition-all flex items-center justify-center ${num === null ? "opacity-0" : num === "del" ? "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10" : "bg-white/5 border border-white/10 text-white hover:bg-green-400/20 hover:border-green-400/40"}`}
          >
            {num === "del" ? "⌫" : num}
          </button>
        ))}
      </div>

      <p className="text-xs text-white/40">Demo PIN: {KIOSK_PIN}</p>
    </div>
  );
}

export default function App() {
  const [ks, setKs] = useState<KioskScreen>("login");
  const [selectedType, setSelectedType] = useState("PET Plastic");
  const [weighing, setWeighing] = useState(false);
  const weight = useAnimatedWeight(2.3, weighing);

  // Check auth state on mount
  useEffect(() => {
    const auth = Waste2GoodsAPI.getAuthState();
    if (auth?.isAuthenticated) {
      setKs("idle");
    }
  }, []);

  const handleLogout = () => {
    Waste2GoodsAPI.logout();
    setKs("login");
  };

  const startFlow = () => {
    setKs("scanning");
    setTimeout(() => {
      setKs("deposit");
    }, 2500);
  };

  const startWeigh = () => {
    setKs("weighing");
    setWeighing(false);
    setTimeout(() => setWeighing(true), 500);
    setTimeout(() => setKs("confirm"), 4500);
  };

  const pts = Math.round(weight * (selectedType === "Metal Cans" ? 80 : selectedType === "PET Plastic" ? 50 : selectedType === "Cardboard" ? 30 : 25));

  if (ks === "login") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Kiosk display */}
        <div className="relative overflow-hidden" style={{
          width: 900, height: 560,
          background: "linear-gradient(135deg, #042318 0%, #0a3d1f 40%, #0c3547 100%)",
          borderRadius: 20,
          border: "3px solid rgba(255,255,255,0.08)",
          boxShadow: "0 50px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)"
        }}>
          {/* Scanline texture */}
          <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 4px)" }} />
          {/* Glow orb */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #16a34a, transparent)" }} />
          
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 px-8 py-3 flex items-center justify-between border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center"><Recycle className="w-4 h-4 text-green-400" /></div>
              <div>
                <p className="text-white font-black text-sm leading-none">Waste2Goods</p>
                <p className="text-green-400 text-xs">K-01 · Bagong Pag-asa Hall</p>
              </div>
            </div>
            <div className="flex items-center gap-5 text-xs text-green-300">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span>Online</span></div>
              <div className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5" /><span>Connected</span></div>
              <div className="flex items-center gap-1.5"><Battery className="w-3.5 h-3.5" /><span>94%</span></div>
              <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /><span>9:41 AM · Jun 17, 2026</span></div>
            </div>
          </div>

          <div className="h-full pt-14">
            <LoginScreen onLogin={() => setKs("idle")} />
          </div>
        </div>
      </div>
    );
  }

  const auth = Waste2GoodsAPI.getAuthState();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Kiosk display */}
      <div className="relative overflow-hidden" style={{
        width: 900, height: 560,
        background: "linear-gradient(135deg, #042318 0%, #0a3d1f 40%, #0c3547 100%)",
        borderRadius: 20,
        border: "3px solid rgba(255,255,255,0.08)",
        boxShadow: "0 50px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)"
      }}>
        {/* Scanline texture */}
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 4px)" }} />
        {/* Glow orb */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #16a34a, transparent)" }} />

        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 px-8 py-3 flex items-center justify-between border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center"><Recycle className="w-4 h-4 text-green-400" /></div>
            <div>
              <p className="text-white font-black text-sm leading-none">Waste2Goods</p>
              <p className="text-green-400 text-xs">K-01 · Bagong Pag-asa Hall</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs text-green-300">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span>Online</span></div>
            <div className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5" /><span>Connected</span></div>
            <div className="flex items-center gap-1.5"><Battery className="w-3.5 h-3.5" /><span>94%</span></div>
            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /><span>9:41 AM · Jun 17, 2026</span></div>
            {ks === "idle" && (
              <button onClick={handleLogout} className="flex items-center gap-1.5 hover:text-white transition-colors">
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="h-full pt-14 flex items-center justify-center px-10">

          {/* IDLE */}
          {ks === "idle" && (
            <div className="flex flex-col items-center gap-7 text-center">
              <div className="relative">
                <div className="w-40 h-40 rounded-3xl bg-white p-2 border border-white/15 flex items-center justify-center" style={{ boxShadow: "0 0 80px rgba(22,163,74,0.25)" }}>
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=waste2goods://kiosk/K-01" 
                    alt="QR Code"
                    className="w-full h-full"
                  />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-400 border-2 border-green-900 flex items-center justify-center animate-pulse">
                  <Wifi className="w-3.5 h-3.5 text-green-900" />
                </div>
              </div>
              <div>
                <h1 className="text-6xl font-black text-white tracking-tight mb-3" style={{ textShadow: "0 0 40px rgba(74,222,128,0.2)" }}>Scan to Start</h1>
                <p className="text-green-300 text-lg max-w-md mx-auto leading-relaxed">Open the Waste2Goods app, tap <strong className="text-white">Submit Recyclables</strong>, and scan this screen to begin.</p>
              </div>
              <div className="flex gap-5">
                {[["♻️","PET Plastic","50 pts/kg"]].map(([e,l,p]) => (
                  <div key={String(l)} className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-2xl">{String(e)}</span>
                    <span className="text-xs text-white font-semibold">{String(l)}</span>
                    <span className="text-xs text-green-400 font-bold">{String(p)}</span>
                  </div>
                ))}
              </div>
              <button onClick={startFlow} className="px-10 py-4 rounded-2xl bg-green-500 text-white font-black text-xl hover:bg-green-400 transition-all" style={{ boxShadow: "0 0 40px rgba(74,222,128,0.3)" }}>
                Demo: Simulate Scan
              </button>
            </div>
          )}

          {/* SCANNING */}
          {ks === "scanning" && (
            <div className="flex flex-col items-center gap-8 text-center">
              <div className="relative w-40 h-40">
                <div className="absolute inset-0 rounded-3xl border-2 border-green-400/30 animate-ping" style={{ animationDuration: "1.5s" }} />
                <div className="absolute inset-4 rounded-2xl border-2 border-green-400/60 animate-ping" style={{ animationDuration: "1.8s", animationDelay: "0.3s" }} />
                <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-green-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-green-400 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-green-400 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-green-400 rounded-br-xl" />
                <div className="absolute inset-0 flex items-center justify-center"><QrCode className="w-16 h-16 text-green-400/60" /></div>
              </div>
              <div>
                <h2 className="text-4xl font-black text-white mb-2">Reading QR Code...</h2>
                <p className="text-green-300">Authenticating resident identity</p>
              </div>
              <div className="flex gap-2">
                {[0,1,2,3].map(i => <div key={i} className="w-3 h-3 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          )}

          {/* DEPOSIT */}
          {ks === "deposit" && (
            <div className="w-full flex gap-8 items-center">
              <div className="flex-1 space-y-4">
                <div className="rounded-2xl bg-white/8 border border-white/15 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-400/20 border border-green-400/30 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-black">Maria Santos — verified</p>
                      <p className="text-green-300 text-xs">Bagong Pag-asa · Balance: 2,725 pts</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2">Select Recyclable Type</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[["♻️","PET Plastic"]].map(([e,l]) => (
                        <button key={String(l)} onClick={() => setSelectedType(String(l))} className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all ${selectedType===String(l)?"border-green-400 bg-green-400/10 text-green-300":"border-white/15 bg-white/5 text-white/60 hover:border-white/30"}`}>
                          <span className="text-xl">{String(e)}</span>{String(l)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">Deposit Instructions</p>
                  <ol className="space-y-2">
                    {["Open the collection bin door below","Place your recyclables inside","Close the door securely","Wait for the scale to stabilize"].map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-0.5">{i+1}</div>
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
                <button onClick={startWeigh} className="w-full py-4 rounded-2xl bg-green-500 text-white font-black text-lg hover:bg-green-400 transition-all" style={{ boxShadow: "0 0 30px rgba(74,222,128,0.25)" }}>
                  Start Weighing
                </button>
              </div>
            </div>
          )}

          {/* WEIGHING */}
          {ks === "weighing" && (
            <div className="w-full flex gap-10 items-center">
              <div className="flex flex-col items-center gap-4 flex-shrink-0">
                <p className="text-green-300 text-sm font-bold uppercase tracking-widest">Live Weight</p>
                <div className="relative w-56 h-56 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                    <circle cx="100" cy="100" r="88" fill="none" stroke="#16a34a" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${2*Math.PI*88}`}
                      strokeDashoffset={`${2*Math.PI*88 * (1 - Math.min(1, weight / 5))}`}
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
                  <span className="text-green-300 text-xs font-semibold">Measuring {selectedType}...</span>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="rounded-2xl bg-white/8 border border-white/15 p-5">
                  <div className="grid grid-cols-2 gap-4">
                    {[["Resident","Maria Santos"],["Type",selectedType],["Rate",(selectedType==="Metal Cans"?"80":selectedType==="PET Plastic"?"50":selectedType==="Cardboard"?"30":"25")+" pts/kg"],["Kiosk","K-01"]].map(([l,v]) => (
                      <div key={String(l)} className="rounded-xl bg-white/5 p-3">
                        <p className="text-green-400 text-xs font-bold">{l}</p>
                        <p className="text-white font-black text-sm mt-0.5">{v}</p>
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
          )}

          {/* CONFIRM */}
          {ks === "confirm" && (
            <div className="w-full flex gap-8 items-center">
              <div className="flex-1 space-y-4">
                <div className="rounded-2xl bg-white/8 border border-white/15 p-5 space-y-3">
                  <h3 className="text-white font-black text-lg">Submission Summary</h3>
                  <div className="space-y-2 text-sm">
                    {[["Resident","Maria Santos"],["Recyclable Type",selectedType],["Weight Measured","2.30 kg"],["Rate","50 pts/kg"],["Kiosk","K-01 · Bagong Pag-asa Hall"],["Timestamp","Jun 17, 2026 · 9:41 AM"]].map(([l,v]) => (
                      <div key={String(l)} className="flex justify-between border-b border-white/8 pb-1.5 last:border-0 last:pb-0">
                        <span className="text-green-300 font-semibold">{l}</span>
                        <span className="text-white font-bold">{v}</span>
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
                  <p className="text-3xl font-black text-white">2,840</p>
                  <p className="text-green-400 text-sm font-bold">pts</p>
                </div>
                <button onClick={() => setKs("done")} className="w-full py-4 rounded-2xl bg-green-500 text-white font-black text-lg hover:bg-green-400 transition-all" style={{ boxShadow: "0 0 30px rgba(74,222,128,0.25)" }}>
                  Confirm ✓
                </button>
                <button onClick={() => setKs("idle")} className="w-full py-2.5 rounded-2xl border border-white/20 text-white/60 text-sm font-semibold hover:bg-white/5 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* DONE */}
          {ks === "done" && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-green-400/20 border-4 border-green-400 flex items-center justify-center" style={{ boxShadow: "0 0 80px rgba(74,222,128,0.4)" }}>
                  <Check className="w-12 h-12 text-green-400" />
                </div>
                <div className="absolute -top-4 -right-4 text-4xl animate-bounce">🎉</div>
              </div>
              <div>
                <h2 className="text-5xl font-black text-white mb-2">Salamat, Maria!</h2>
                <p className="text-green-300 text-lg">Your submission has been recorded and points awarded.</p>
              </div>
              {/* Make new balance even more prominent! */}
              <div className="rounded-3xl bg-primary/20 border border-primary/40 p-6 w-full max-w-md" style={{ boxShadow: "0 0 50px rgba(22,163,74,0.3)" }}>
                <p className="text-green-300 text-xs font-bold uppercase tracking-widest mb-1">New Points Balance</p>
                <p className="text-6xl font-black text-white">2,840</p>
                <p className="text-green-400 text-xl font-bold">pts</p>
              </div>
              <div className="flex gap-4">
                {[["Weight","2.3 kg","text-white","bg-white/10"],["Points Earned","+115 pts","text-green-400","bg-green-500/15 border-green-400/30"]].map(([l,v,tc,bg]) => (
                  <div key={String(l)} className={`px-5 py-3 rounded-2xl ${bg} border border-white/15 text-center`}>
                    <p className="text-green-300 text-xs font-bold uppercase tracking-widest mb-1">{l}</p>
                    <p className={`text-xl font-black ${tc}`}>{v}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
                <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <p className="text-white text-sm font-semibold">You moved to <strong className="text-yellow-300">#3</strong> on this week's leaderboard! 🏆 Keep recycling!</p>
              </div>
              <button onClick={() => { setKs("idle"); setWeighing(false); }} className="text-sm text-green-400 font-semibold hover:text-green-300 transition-colors underline underline-offset-4">
                Tap anywhere to return to main screen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
