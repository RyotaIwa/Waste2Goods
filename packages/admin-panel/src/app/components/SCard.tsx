
import React from "react";

export function SCard({ label, value, sub, icon, color, trend }: Readonly<{
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}>) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-border">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        {trend && <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">{trend}</span>}
      </div>
      <p className="text-2xl font-black text-foreground leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-1.5 font-medium">{label}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

export function RankIcon({ rank }: Readonly<{ rank: number }>) {
  if (rank === 1) return <div className="w-5 h-5 flex items-center justify-center text-yellow-400">🏆</div>;
  if (rank === 2) return <div className="w-5 h-5 flex items-center justify-center text-gray-400">🥈</div>;
  if (rank === 3) return <div className="w-5 h-5 flex items-center justify-center text-amber-600">🥉</div>;
  return <span className="text-xs text-muted-foreground font-mono font-bold">#{rank}</span>;
}

export function StatusPip({ status }: Readonly<{ status: string }>) {
  const colors: Record<string, string> = {
    online: "bg-emerald-400",
    offline: "bg-red-400",
    maintenance: "bg-amber-400",
    active: "bg-emerald-400",
    inactive: "bg-gray-300",
  };
  return (
    <span className={`inline-block w-3 h-3 rounded-full ${colors[status] || "bg-gray-300"}`} />
  );
}
