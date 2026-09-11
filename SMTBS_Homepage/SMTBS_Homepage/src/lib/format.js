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

// Converts a DB "HH:MM:SS" time string to a display "10:00 AM" string.
export function formatTime(time24) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}
