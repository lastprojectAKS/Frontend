import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  Confirmed: "var(--color-success)",
  Pending: "var(--color-warning)",
  Cancelled: "var(--color-error)",
  Refunded: "var(--color-text-muted)",
};

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { status, count } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-xs shadow-elevated">
      <p className="font-semibold text-text-primary">{status}</p>
      <p className="text-text-secondary">{count} bookings</p>
    </div>
  );
}

export default function BookingStatusChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="mb-5 font-semibold text-text-primary">Booking Analytics</h3>

      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <div className="relative h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="status" innerRadius={55} outerRadius={78} paddingAngle={2}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={COLORS[entry.status]} stroke="var(--color-surface)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-text-primary">{total}</span>
            <span className="text-xs text-text-muted">Total</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5">
          {data.map((d) => (
            <div key={d.status} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-text-secondary">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[d.status] }} aria-hidden="true" />
                {d.status}
              </span>
              <span className="font-semibold text-text-primary">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
