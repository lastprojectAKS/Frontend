import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "smtbs-user";

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function nameFromEmail(email) {
  const local = email.split("@")[0] || "";
  const words = local.replace(/[._\d]+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "Member";
  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);
  const [authModal, setAuthModal] = useState({ open: false, mode: "login" });

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* localStorage unavailable — session just won't persist */
    }
  }, [user]);

  const login = useCallback(({ email }) => {
    setUser({
      name: nameFromEmail(email),
      email,
      memberSince: String(new Date().getFullYear()),
      loyaltyPoints: 240,
    });
  }, []);

  const signup = useCallback(({ name, email }) => {
    setUser({
      name: name.trim() || nameFromEmail(email),
      email,
      memberSince: String(new Date().getFullYear()),
      loyaltyPoints: 0,
    });
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const openAuthModal = useCallback((mode = "login") => setAuthModal({ open: true, mode }), []);
  const closeAuthModal = useCallback(() => setAuthModal((s) => ({ ...s, open: false })), []);

  const value = {
    user,
    isLoggedIn: Boolean(user),
    login,
    signup,
    logout,
    authModal,
    openAuthModal,
    closeAuthModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
