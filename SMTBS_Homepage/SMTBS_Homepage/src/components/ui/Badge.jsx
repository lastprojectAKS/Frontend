const TONES = {
  neutral: "bg-surface text-text-secondary border border-border-strong",
  accent: "bg-accent/15 text-accent-text border border-accent/30",
  success: "bg-success/15 text-success border border-success/30",
  warning: "bg-warning/15 text-warning border border-warning/30",
  error: "bg-error/15 text-error border border-error/30",
  solid: "bg-accent text-white",
};

export default function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
