
import React from "react";

export function SCard({ label, value, sub, icon, color, trend }: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-border">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        {trend && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{trend}</span>}
      </div>
      <p className="text-2xl font-black text-foreground leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

export function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-4 h-4 flex items-center justify-center text-yellow-400">🏆</div>;
  if (rank === 2) return <div className="w-4 h-4 flex items-center justify-center text-gray-400">🥈</div>;
  if (rank === 3) return <div className="w-4 h-4 flex items-center justify-center text-amber-600">🥉</div>;
  return <span className="text-xs text-muted-foreground font-mono font-bold">#{rank}</span>;
}

export function StatusPip({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: "bg-emerald-400",
    offline: "bg-red-400",
    maintenance: "bg-amber-400",
    active: "bg-emerald-400",
    inactive: "bg-gray-300",
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || "bg-gray-300"}`} />
  );
}
