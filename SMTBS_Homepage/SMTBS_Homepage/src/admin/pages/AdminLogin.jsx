import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Clapperboard, Loader2, AlertCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import { useAdminAuth } from "../context/AdminAuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminLogin() {
  const { isAuthenticated, login, demoAccounts } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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

  function handleSubmit(e) {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    setTimeout(() => {
      const result = login({ email, password, remember });
      setSubmitting(false);
      if (!result.success) {
        setErrors({ form: result.error });
        return;
      }
      navigate(location.state?.from ?? "/admin/dashboard", { replace: true });
    }, 500);
  }

  function fillDemo(account) {
    setEmail(account.email);
    setPassword(account.password);
    setErrors({});
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

        <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-border bg-surface p-6 shadow-elevated">
          {errors.form && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 px-3.5 py-2.5 text-sm text-error">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {errors.form}
            </div>
          )}

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

          <div className="mb-5 flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-text-secondary">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => setErrors({ form: "Password reset isn't available in this demo." })}
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

        <div className="mt-5 rounded-xl border border-dashed border-border-strong bg-surface/60 p-4 text-xs text-text-secondary">
          <p className="mb-2 font-semibold text-text-primary">Demo accounts (frontend only)</p>
          <ul className="flex flex-col gap-1.5">
            {demoAccounts.map((account) => (
              <li key={account.email} className="flex items-center justify-between gap-3">
                <span>
                  {account.role} — <span className="font-mono">{account.email}</span>
                </span>
                <button
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="shrink-0 rounded-md bg-bg-secondary px-2 py-1 font-semibold text-accent-text hover:bg-surface-hover"
                >
                  Use
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
