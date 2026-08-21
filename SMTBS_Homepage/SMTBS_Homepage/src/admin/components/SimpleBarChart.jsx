import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

function ChartTooltip({ active, payload, valueFormatter }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-xs shadow-elevated">
      <p className="font-semibold text-text-primary">{name}</p>
      <p className="text-text-secondary">{valueFormatter ? valueFormatter(value) : value}</p>
    </div>
  );
}

export default function SimpleBarChart({ data, height = 260, valueFormatter }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          stroke="var(--color-text-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={110}
        />
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} cursor={{ fill: "var(--color-surface-hover)" }} />
        <Bar dataKey="value" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
