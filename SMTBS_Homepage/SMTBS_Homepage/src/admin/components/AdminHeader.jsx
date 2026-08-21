import { Menu, Search, Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function AdminHeader({ onOpenDrawer }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-bg-primary/95 px-4 backdrop-blur-sm sm:px-6">
      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Open menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-surface hover:text-text-primary lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search movies, bookings, customers..."
          aria-label="Search"
          className="h-10 w-full rounded-lg border border-border-strong bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
        >
          {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
