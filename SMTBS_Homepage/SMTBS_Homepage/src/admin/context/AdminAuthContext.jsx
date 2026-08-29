import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

const AdminAuthContext = createContext(null);

// profiles.role is stored snake_case; the admin UI has always displayed
// Title Case ("Super Admin" etc.) — map once here so nothing downstream
// (SidebarFooter, Settings, StatusBadge) needs to know about the DB shape.
const ROLE_LABELS = {
  super_admin: "Super Admin",
  cinema_manager: "Cinema Manager",
  booking_manager: "Booking Manager",
};

async function fetchProfile(userId) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}

function toAdmin(profile) {
  if (!profile || profile.role === "customer") return null;
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: ROLE_LABELS[profile.role] ?? profile.role,
  };
}

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function syncSession(session) {
      if (!session) {
        if (!cancelled) setAdmin(null);
        return;
      }
      const profile = await fetchProfile(session.user.id);
      if (!cancelled) setAdmin(toAdmin(profile));
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session).finally(() => {
        if (!cancelled) setLoading(false);
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: "Incorrect email or password." };

    const profile = await fetchProfile(data.user.id);
    if (!profile || profile.role === "customer") {
      await supabase.auth.signOut();
      return { success: false, error: "This account doesn't have admin access." };
    }

    setAdmin(toAdmin(profile));
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // OAuth is a full-page redirect through Google, not a synchronous call —
  // there's no return value to check the role against like login() does.
  // We land back on /admin/login?oauth=1, and that page's own effect
  // (once the session/profile has resolved) is what rejects a non-admin
  // account and signs it out — see AdminLogin.jsx.
  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/admin/login?oauth=1` },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const updateProfile = useCallback(
    async (patch) => {
      if (!admin) return;
      const { error } = await supabase.from("profiles").update(patch).eq("id", admin.id);
      if (!error) setAdmin((current) => (current ? { ...current, ...patch } : current));
    },
    [admin]
  );

  const value = {
    admin,
    isAuthenticated: Boolean(admin),
    loading,
    login,
    loginWithGoogle,
    logout,
    updateProfile,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return ctx;
}
