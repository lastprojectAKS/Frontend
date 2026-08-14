import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Search, MapPin, User, Menu, Clapperboard, ChevronDown, LogOut, Sun, Moon } from "lucide-react";
import MobileDrawer from "./MobileDrawer";
import useScrollPosition from "../../hooks/useScrollPosition";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useTheme } from "../../context/ThemeContext";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/movies", label: "Movies" },
  { to: "/cinemas", label: "Cinemas" },
  { to: "/offers", label: "Offers" },
];

const CITIES = ["New York, NY", "Los Angeles, CA", "Chicago, IL", "Austin, TX"];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const scrolled = useScrollPosition(60);
  const solid = scrolled || !isHome;

  const { isLoggedIn, user, logout, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [city, setCity] = useState(CITIES[0]);
  const searchInputRef = useRef(null);
  const cityRef = useRef(null);
  const accountRef = useRef(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (cityRef.current && !cityRef.current.contains(e.target)) setCityOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    setAccountOpen(false);
    showToast("You've been logged out");
    if (location.pathname === "/profile") navigate("/");
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    navigate(searchValue.trim() ? `/movies?q=${encodeURIComponent(searchValue.trim())}` : "/movies");
    setSearchOpen(false);
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[80] border-b transition-colors duration-300 ${
          solid
            ? "border-border bg-bg-primary/92 backdrop-blur-md"
            : "theme-dark-scope border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-extrabold text-text-primary">
            <Clapperboard className="h-6 w-6 text-accent" aria-hidden="true" />
            SMTBS
          </NavLink>

          <nav aria-label="Main navigation" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <form onSubmit={handleSearchSubmit} className="hidden items-center sm:flex">
              {searchOpen ? (
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onBlur={() => !searchValue && setSearchOpen(false)}
                  placeholder="Search movies..."
                  aria-label="Search movies"
                  className="h-9 w-48 rounded-lg border border-border-strong bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Open search"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </form>

            <button
              type="button"
              onClick={() => navigate("/movies")}
              aria-label="Search movies"
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface hover:text-text-primary sm:hidden"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="relative hidden lg:block" ref={cityRef}>
              <button
                type="button"
                onClick={() => setCityOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={cityOpen}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {city}
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              {cityOpen && (
                <ul
                  role="listbox"
                  className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-border-strong bg-surface py-1 shadow-elevated"
                >
                  {CITIES.map((c) => (
                    <li key={c}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={c === city}
                        onClick={() => {
                          setCity(c);
                          setCityOpen(false);
                        }}
                        className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover ${
                          c === city ? "text-accent-text" : "text-text-secondary"
                        }`}
                      >
                        {c}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={isDark}
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            >
              {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </button>

            {isLoggedIn ? (
              <div className="relative hidden sm:block" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  aria-label="Account menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-text transition-colors hover:bg-accent/25"
                >
                  {user.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </button>

                {accountOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-border-strong bg-surface py-1 shadow-elevated"
                  >
                    <div className="border-b border-border px-3.5 py-2.5">
                      <p className="truncate text-sm font-semibold text-text-primary">{user.name}</p>
                      <p className="truncate text-xs text-text-muted">{user.email}</p>
                    </div>
                    <NavLink
                      to="/profile"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                    >
                      <User className="h-4 w-4" aria-hidden="true" />
                      My Profile
                    </NavLink>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface sm:block"
              >
                Login
              </button>
            )}

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface hover:text-text-primary md:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
