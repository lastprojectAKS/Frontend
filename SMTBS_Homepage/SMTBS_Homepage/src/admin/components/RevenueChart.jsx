import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { groupSeries, formatChartDate } from "../lib/chartUtils";
import { formatCurrency } from "../../lib/format";

const GRANULARITIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-xs shadow-elevated">
      <p className="mb-1 font-semibold text-text-primary">{label}</p>
      <p className="text-text-secondary">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export default function RevenueChart({ dailySeries }) {
  const [granularity, setGranularity] = useState("daily");
  const [chartType, setChartType] = useState("line");

  const data = useMemo(() => {
    const grouped = groupSeries(dailySeries, granularity, ["revenue"]);
    return grouped.map((d) => ({ ...d, label: formatChartDate(d.date, granularity) }));
  }, [dailySeries, granularity]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-text-primary">Revenue Overview</h3>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-border-strong p-0.5">
            {GRANULARITIES.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGranularity(g.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  granularity === g.value ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-border-strong p-0.5">
            {["line", "bar"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setChartType(type)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                  chartType === type ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        {chartType === "line" ? (
          <LineChart data={data} margin={{ left: -20 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border-strong)" }} />
            <Line type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ left: -20 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-hover)" }} />
            <Bar dataKey="revenue" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
