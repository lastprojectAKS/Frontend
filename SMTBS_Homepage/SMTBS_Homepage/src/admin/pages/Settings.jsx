import { useState } from "react";
import { User, Lock, Bell, SlidersHorizontal, Sun, Moon, Loader2 } from "lucide-react";
import Button from "../../components/ui/Button";
import StatusBadge from "../components/StatusBadge";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";

const inputClass =
  "h-11 w-full rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50";
const labelClass = "flex flex-col gap-1.5 text-sm";
const captionClass = "font-medium text-text-secondary";

function SettingsSection({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-text">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold text-text-primary">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-text-secondary">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2.5">
      <span>
        <span className="block text-sm font-medium text-text-primary">{label}</span>
        {description && <span className="block text-xs text-text-muted">{description}</span>}
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="absolute inset-0 rounded-full bg-surface-hover transition-colors peer-checked:bg-accent" />
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export default function AdminSettings() {
  const { admin, updateProfile } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [name, setName] = useState(admin.name);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    newBookings: true,
    cancellations: true,
    lowOccupancy: false,
    weeklySummary: true,
  });

  const [prefs, setPrefs] = useState({ pageSize: "10", dateFormat: "yyyy-mm-dd" });

  function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setTimeout(() => {
      updateProfile({ name: name.trim() || admin.name });
      setSavingProfile(false);
      showToast("Profile updated.");
    }, 300);
  }

  function savePassword(e) {
    e.preventDefault();
    setPasswordError("");
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      setPasswordError("Fill in all three fields.");
      return;
    }
    if (passwords.next.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }
    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setPasswords({ current: "", next: "", confirm: "" });
      showToast("Password updated. (Demo only — not persisted.)");
    }, 300);
  }

  function saveNotifications() {
    showToast("Notification preferences saved.");
  }

  function savePrefs() {
    showToast("System preferences saved.");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your admin profile, security, and workspace preferences.</p>
      </div>

      <div className="flex flex-col gap-6">
        <SettingsSection icon={User} title="Profile" description="Your name and role as shown across the admin portal.">
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={captionClass}>Full name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </label>
              <label className={labelClass}>
                <span className={captionClass}>Email</span>
                <input value={admin.email} disabled className={inputClass} />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className={captionClass}>Role</span>
              <StatusBadge status={admin.role} className="!bg-accent/15 !text-accent-text !border-accent/30" />
            </div>
            <Button type="submit" className="w-fit" disabled={savingProfile}>
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Save profile"}
            </Button>
          </form>
        </SettingsSection>

        <SettingsSection icon={Lock} title="Security" description="Update your password. This is a frontend demo — nothing is sent to a server.">
          <form onSubmit={savePassword} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className={labelClass}>
                <span className={captionClass}>Current password</span>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className={captionClass}>New password</span>
                <input
                  type="password"
                  value={passwords.next}
                  onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className={captionClass}>Confirm new password</span>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  className={inputClass}
                />
              </label>
            </div>
            {passwordError && <p className="text-xs text-error">{passwordError}</p>}
            <Button type="submit" className="w-fit" disabled={savingPassword}>
              {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Update password"}
            </Button>
          </form>
        </SettingsSection>

        <SettingsSection icon={Bell} title="Notifications" description="Choose what triggers an alert in your admin notification bell.">
          <div className="divide-y divide-border">
            <Toggle
              checked={notifications.newBookings}
              onChange={(v) => setNotifications((n) => ({ ...n, newBookings: v }))}
              label="New bookings"
              description="Notify me when a customer completes a booking."
            />
            <Toggle
              checked={notifications.cancellations}
              onChange={(v) => setNotifications((n) => ({ ...n, cancellations: v }))}
              label="Cancellations & refunds"
              description="Notify me when a booking is cancelled or refunded."
            />
            <Toggle
              checked={notifications.lowOccupancy}
              onChange={(v) => setNotifications((n) => ({ ...n, lowOccupancy: v }))}
              label="Low occupancy alerts"
              description="Notify me when an upcoming showtime is under 20% booked."
            />
            <Toggle
              checked={notifications.weeklySummary}
              onChange={(v) => setNotifications((n) => ({ ...n, weeklySummary: v }))}
              label="Weekly performance summary"
              description="A recap of revenue and bookings every Monday."
            />
          </div>
          <Button className="mt-4 w-fit" onClick={saveNotifications}>
            Save preferences
          </Button>
        </SettingsSection>

        <SettingsSection icon={SlidersHorizontal} title="System Preferences" description="Workspace defaults for this admin session.">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 rounded-lg bg-bg-secondary px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-text-primary">Theme</span>
                <span className="block text-xs text-text-muted">Applies across the whole admin portal.</span>
              </span>
              <Button size="sm" variant="secondary" icon={theme === "dark" ? Sun : Moon} onClick={toggleTheme}>
                Switch to {theme === "dark" ? "Light" : "Dark"}
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={captionClass}>Rows per table page</span>
                <select value={prefs.pageSize} onChange={(e) => setPrefs((p) => ({ ...p, pageSize: e.target.value }))} className={inputClass}>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </label>
              <label className={labelClass}>
                <span className={captionClass}>Date format</span>
                <select value={prefs.dateFormat} onChange={(e) => setPrefs((p) => ({ ...p, dateFormat: e.target.value }))} className={inputClass}>
                  <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                  <option value="dd-mm-yyyy">DD-MM-YYYY</option>
                  <option value="mm-dd-yyyy">MM-DD-YYYY</option>
                </select>
              </label>
            </div>

            <Button className="w-fit" onClick={savePrefs}>
              Save preferences
            </Button>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
