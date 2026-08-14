import { motion } from "framer-motion";
import { Accessibility } from "lucide-react";

export default function Seat({ seat, selected, onToggle }) {
  const { id, occupied, vip, accessible } = seat;

  const label = `Seat ${id}${vip ? ", VIP" : ""}${accessible ? ", wheelchair accessible" : ""}${
    occupied ? ", occupied" : selected ? ", selected" : ", available"
  }`;

  let classes = "border-border-strong bg-surface text-text-secondary hover:border-accent hover:text-text-primary";
  if (occupied) classes = "border-border bg-bg-secondary text-text-muted cursor-not-allowed";
  else if (selected) classes = "border-accent bg-accent text-white";
  else if (vip) classes = "border-warning/50 bg-warning/10 text-warning hover:border-warning";

  return (
    <motion.button
      type="button"
      disabled={occupied}
      onClick={onToggle}
      aria-label={label}
      aria-pressed={selected}
      whileTap={occupied ? undefined : { scale: 0.9 }}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[10px] font-semibold transition-colors sm:h-8 sm:w-8 ${classes}`}
    >
      {accessible ? <Accessibility className="h-3.5 w-3.5" aria-hidden="true" /> : seat.number}
    </motion.button>
  );
}
