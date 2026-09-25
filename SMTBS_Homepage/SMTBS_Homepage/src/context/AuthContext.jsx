import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

async function fetchProfile(userId) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}

function toUser(session, profile) {
  if (!session || !profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    memberSince: String(new Date(profile.member_since).getFullYear()),
    loyaltyPoints: profile.loyalty_points,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState({ open: false, mode: "login" });

  useEffect(() => {
    let cancelled = false;

    async function syncSession(session) {
      if (!session) {
        if (!cancelled) setUser(null);
        return;
      }
      const profile = await fetchProfile(session.user.id);
      if (!cancelled) setUser(toUser(session, profile));
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const signup = useCallback(async ({ name, email, password, phone }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim(), phone: phone?.trim() || null } },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Phone sign-in is a single OTP credential shared by login and signup —
  // Supabase creates the account on first use, same as a password signup
  // would, so there's no separate "sign up with phone" call. Not wired
  // into the UI yet — waiting on Twilio being configured in Supabase.
  const sendPhoneOtp = useCallback(async (phone) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const verifyPhoneOtp = useCallback(async (phone, token) => {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  // Sends a real reset-password email via Supabase's own auth flow — the
  // link lands on /reset-password, which supabase-js turns into an active
  // session automatically (detectSessionInUrl), then updatePassword below
  // sets the new password on it.
  const requestPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const openAuthModal = useCallback((mode = "login") => setAuthModal({ open: true, mode }), []);
  const closeAuthModal = useCallback(() => setAuthModal((s) => ({ ...s, open: false })), []);

  // Re-fetches the current user's profile without waiting for the next auth
  // state change — used right after an action that changes it server-side
  // (booking/cancelling earns or reverses loyalty points) so Profile shows
  // the new total immediately instead of only after a reload.
  const refreshUser = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const profile = await fetchProfile(session.user.id);
    setUser(toUser(session, profile));
  }, []);

  const value = {
    user,
    isLoggedIn: Boolean(user),
    loading,
    login,
    signup,
    logout,
    sendPhoneOtp,
    verifyPhoneOtp,
    loginWithGoogle,
    requestPasswordReset,
    updatePassword,
    authModal,
    openAuthModal,
    closeAuthModal,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
