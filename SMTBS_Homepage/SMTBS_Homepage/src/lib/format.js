export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

export function formatDate(iso, options = { weekday: "long", day: "numeric", month: "long" }) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", options);
}
