import React from "react";
import GlassCard from "./GlassCard";

const StatCard = ({ label, value, subtitle, icon: Icon, tone = "indigo" }) => {
  const toneClass =
    tone === "emerald"
      ? "from-emerald-400 to-teal-400"
      : tone === "rose"
      ? "from-rose-400 to-pink-500"
      : "from-indigo-400 to-purple-500";

  return (
    <GlassCard className="p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
            {label}
          </div>
          <div className="text-2xl font-semibold text-slate-50 mt-1">
            {value}
          </div>
        </div>
        {Icon && (
          <div
            className={`h-9 w-9 rounded-xl bg-gradient-to-tr ${toneClass} flex items-center justify-center text-slate-900`}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {subtitle && (
        <div className="text-xs text-slate-400 mt-1">{subtitle}</div>
      )}
    </GlassCard>
  );
};

export default StatCard;

