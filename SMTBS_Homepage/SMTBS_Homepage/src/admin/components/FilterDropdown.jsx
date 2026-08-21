import { ChevronDown } from "lucide-react";

export default function FilterDropdown({ label, value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-10 appearance-none rounded-lg border border-border-strong bg-surface py-2 pl-3 pr-9 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
        aria-hidden="true"
      />
    </div>
  );
}
