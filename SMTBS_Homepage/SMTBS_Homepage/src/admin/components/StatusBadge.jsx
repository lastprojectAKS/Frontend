// Every status string used across admin pages maps to one tone here, so a
// given word always reads the same way no matter which table it's in.
const STATUS_TONE = {
  // Bookings
  Confirmed: "success",
  Pending: "warning",
  Cancelled: "error",
  Refunded: "neutral",
  // Payments
  Paid: "success",
  Failed: "error",
  // Movies
  "Now Showing": "success",
  Upcoming: "accent",
  Ended: "neutral",
  Draft: "neutral",
  Inactive: "error",
  // Cinemas / screens / showtimes
  Active: "success",
  Scheduled: "accent",
  Completed: "neutral",
};

const TONE_CLASSES = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  error: "bg-error/15 text-error border-error/30",
  accent: "bg-accent/15 text-accent-text border-accent/30",
  neutral: "bg-surface-hover text-text-secondary border-border-strong",
};

export default function StatusBadge({ status, className = "" }) {
  const tone = STATUS_TONE[status] || "neutral";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}
    >
      {status}
    </span>
  );
}
