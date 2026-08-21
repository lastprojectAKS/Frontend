import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({ label, value, icon: Icon, trend, tone = "default" }) {
  const iconTone = tone === "accent" ? "bg-accent/15 text-accent-text" : "bg-surface-hover text-text-secondary";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        {Icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconTone}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold text-text-primary">{value}</span>
        {trend !== undefined && trend !== null && (
          <span
            className={`mb-0.5 flex items-center gap-0.5 text-xs font-semibold ${
              trend >= 0 ? "text-success" : "text-error"
            }`}
          >
            {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
