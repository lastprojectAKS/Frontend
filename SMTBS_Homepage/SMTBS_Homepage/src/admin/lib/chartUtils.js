import { startOfWeek } from "./dateUtils";

function monthKey(dateStr) {
  return dateStr.slice(0, 7);
}

/**
 * Groups a { date, ...numericFields } series into weekly or monthly
 * buckets, summing every numeric field. "daily" returns the series as-is.
 */
export function groupSeries(series, granularity, numericKeys) {
  if (granularity === "daily") return series;

  const keyFn = granularity === "weekly" ? startOfWeek : monthKey;
  const buckets = new Map();

  series.forEach((point) => {
    const key = keyFn(point.date);
    if (!buckets.has(key)) {
      const empty = { date: key };
      numericKeys.forEach((k) => (empty[k] = 0));
      buckets.set(key, empty);
    }
    const bucket = buckets.get(key);
    numericKeys.forEach((k) => (bucket[k] += point[k] || 0));
  });

  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function formatChartDate(dateStr, granularity) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (granularity === "monthly") return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
