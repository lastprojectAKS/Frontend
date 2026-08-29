import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams, Navigate } from "react-router-dom";
import { Clapperboard, Loader2, AlertCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import { useAdminAuth } from "../context/AdminAuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.96H1.27v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.27a12 12 0 0 0 0 10.76l4.01-3.1Z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l4.01 3.1C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

export default function AdminLogin() {
  const { isAuthenticated, loading, login, loginWithGoogle, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  // Google is a full-page redirect, not a call we get a return value from —
  // we land back here at /admin/login?oauth=1 once Supabase has resolved
  // (or failed) the session. If the resulting account isn't an admin,
  // isAuthenticated stays false even though a session now exists, so we
  // sign it out here and explain why, instead of just silently re-showing
  // an empty login form.
  useEffect(() => {
    if (loading || searchParams.get("oauth") !== "1") return;

    const oauthError = searchParams.get("error_description") || searchParams.get("error");
    if (oauthError) {
      setErrors({ form: decodeURIComponent(oauthError.replace(/\+/g, " ")) });
    } else if (!isAuthenticated) {
      logout();
      setErrors({ form: "This account doesn't have admin access." });
    }
    setSearchParams({}, { replace: true });
  }, [loading, isAuthenticated, searchParams, setSearchParams, logout]);

  if (isAuthenticated) {
    const redirectTo = location.state?.from ?? "/admin/dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  function validate() {
    const next = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    const result = await login({ email, password });
    setSubmitting(false);

    if (!result.success) {
      setErrors({ form: result.error });
      return;
    }
    navigate(location.state?.from ?? "/admin/dashboard", { replace: true });
  }

  async function handleGoogle() {
    setGoogleSubmitting(true);
    setErrors({});
    const result = await loginWithGoogle();
    if (!result.success) {
      setGoogleSubmitting(false);
      setErrors({ form: result.error || "Couldn't start Google sign-in. Please try again." });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Clapperboard className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">SMTBS Admin</h1>
          <p className="mt-1 text-sm text-text-secondary">Sign in to manage the platform</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-elevated">
          {errors.form && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 px-3.5 py-2.5 text-sm text-error">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {errors.form}
            </div>
          )}

          <Button type="button" variant="secondary" className="w-full" disabled={googleSubmitting} onClick={handleGoogle}>
            {googleSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <GoogleIcon />}
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs font-medium text-text-muted">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label className="mb-4 flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-text-secondary">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smtbs.example"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                className={`h-11 rounded-lg border bg-bg-secondary px-3.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent ${
                  errors.email ? "border-error" : "border-border-strong"
                }`}
              />
              {errors.email && <span className="text-xs text-error">{errors.email}</span>}
            </label>

            <label className="mb-4 flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-text-secondary">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                className={`h-11 rounded-lg border bg-bg-secondary px-3.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent ${
                  errors.password ? "border-error" : "border-border-strong"
                }`}
              />
              {errors.password && <span className="text-xs text-error">{errors.password}</span>}
            </label>

            <div className="mb-5 flex items-center justify-end text-sm">
              <button
                type="button"
                onClick={() => setErrors({ form: "Password reset isn't set up yet — ask a Super Admin to reset it for you." })}
                className="font-medium text-accent-text hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
