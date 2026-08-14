import { Search } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search movies, cinemas or genres...",
  size = "md",
}) {
  const height = size === "lg" ? "h-14 text-base" : "h-12 text-sm";

  return (
    <div className={`relative flex items-center ${height}`}>
      <Search className="pointer-events-none absolute left-4 h-4 w-4 text-text-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search movies"
        className="h-full w-full rounded-xl border border-border-strong bg-surface pl-11 pr-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}
