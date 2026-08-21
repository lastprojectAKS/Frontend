import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AdminAuthContext = createContext(null);
const STORAGE_KEY = "smtbs-admin-user";

// Deliberately separate from the customer AuthContext/localStorage key —
// an admin session and a customer session are different concepts and
// shouldn't share state just because they're both "logged in" somewhere.
const DEMO_ACCOUNTS = [
  { email: "admin@smtbs.example", password: "admin123", name: "Alex Rivera", role: "Super Admin" },
  { email: "manager@smtbs.example", password: "manager123", name: "Jordan Blake", role: "Cinema Manager" },
  { email: "bookings@smtbs.example", password: "bookings123", name: "Sam Carter", role: "Booking Manager" },
];

function loadStoredAdmin() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(loadStoredAdmin);

  useEffect(() => {
    try {
      if (admin) localStorage.setItem(STORAGE_KEY, JSON.stringify(admin));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* localStorage unavailable — session just won't persist */
    }
  }, [admin]);

  const login = useCallback(({ email, password, remember }) => {
    const account = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
    );

    if (!account) {
      return { success: false, error: "Incorrect email or password." };
    }

    setAdmin({ email: account.email, name: account.name, role: account.role, remember: Boolean(remember) });
    return { success: true };
  }, []);

  const logout = useCallback(() => setAdmin(null), []);

  const updateProfile = useCallback((patch) => {
    setAdmin((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const value = {
    admin,
    isAuthenticated: Boolean(admin),
    login,
    logout,
    updateProfile,
    demoAccounts: DEMO_ACCOUNTS.map(({ email, password, role }) => ({ email, password, role })),
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return ctx;
}
