import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Film,
  Building2,
  CalendarClock,
  Ticket,
  Users,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  ChevronUp,
  Clapperboard,
  X,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useToast } from "../../context/ToastContext";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/movies", label: "Movies", icon: Film },
  { to: "/admin/cinemas", label: "Cinemas & Screens", icon: Building2 },
  { to: "/admin/showtimes", label: "Showtimes", icon: CalendarClock },
  { to: "/admin/bookings", label: "Bookings", icon: Ticket },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, text: "New booking BK-00042 confirmed for Dune: Part Two", time: "5m ago" },
  { id: 2, text: "Screen 2 at SMTBS Downtown is at 92% capacity tonight", time: "1h ago" },
  { id: 3, text: "Echoes of Verity added to Now Showing", time: "3h ago" },
];

function NavItems({ onNavigate }) {
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <NavLink
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent-text"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function SidebarFooter() {
  const { admin, logout } = useAdminAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    showToast("Signed out of admin");
    navigate("/admin/login", { replace: true });
  }

  const initials = admin.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mt-auto flex flex-col gap-2 border-t border-border p-3">
      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={() => setNotifOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={notifOpen}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <span className="relative">
            <Bell className="h-4 w-4" aria-hidden="true" />
            <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
              {MOCK_NOTIFICATIONS.length}
            </span>
          </span>
          Notifications
        </button>

        {notifOpen && (
          <div
            role="menu"
            className="absolute bottom-full left-0 mb-2 w-72 overflow-hidden rounded-xl border border-border-strong bg-surface py-1 shadow-elevated"
          >
            <p className="border-b border-border px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Notifications
            </p>
            {MOCK_NOTIFICATIONS.map((n) => (
              <div key={n.id} className="border-b border-border px-3.5 py-2.5 text-sm last:border-b-0">
                <p className="text-text-primary">{n.text}</p>
                <p className="mt-0.5 text-xs text-text-muted">{n.time}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative" ref={profileRef}>
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={profileOpen}
          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-hover"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-text">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-text-primary">{admin.name}</span>
            <span className="block truncate text-xs text-text-muted">{admin.role}</span>
          </span>
          <ChevronUp className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${profileOpen ? "" : "rotate-180"}`} aria-hidden="true" />
        </button>

        {profileOpen && (
          <div
            role="menu"
            className="absolute bottom-full left-0 mb-2 w-full min-w-[200px] overflow-hidden rounded-xl border border-border-strong bg-surface py-1 shadow-elevated"
          >
            <div className="border-b border-border px-3.5 py-2.5">
              <p className="truncate text-sm font-semibold text-text-primary">{admin.name}</p>
              <p className="truncate text-xs text-text-muted">{admin.email}</p>
            </div>
            <NavLink
              to="/admin/settings"
              onClick={() => setProfileOpen(false)}
              className="block px-3.5 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              Profile
            </NavLink>
            <NavLink
              to="/admin/settings"
              onClick={() => setProfileOpen(false)}
              className="block px-3.5 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              Settings
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-error transition-colors hover:bg-error/10"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminSidebarContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <Clapperboard className="h-6 w-6 text-accent" aria-hidden="true" />
        <span className="text-lg font-extrabold text-text-primary">SMTBS Admin</span>
      </div>
      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3">
        <NavItems onNavigate={onNavigate} />
      </nav>
      <SidebarFooter />
    </div>
  );
}

export default function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-bg-secondary lg:block">
      <div className="fixed h-screen w-64">
        <AdminSidebarContent />
      </div>
    </aside>
  );
}

export function AdminSidebarDrawer({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border bg-bg-secondary shadow-elevated">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-text-secondary hover:text-text-primary"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <AdminSidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}
