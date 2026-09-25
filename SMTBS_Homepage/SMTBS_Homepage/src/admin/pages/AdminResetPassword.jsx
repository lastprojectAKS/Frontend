import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clapperboard, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import { useAdminAuth } from "../context/AdminAuthContext";

// Landed on via the link in an admin password-reset email. Supabase's client
// auto-detects the recovery token in the URL and turns it into a real
// session before this component even mounts — isAuthenticated being true
// here IS the proof the link was valid for an admin account.
export default function AdminResetPassword() {
  const { isAuthenticated, loading, updatePassword } = useAdminAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || "Couldn't update your password. Please request a new reset link.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Clapperboard className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">SMTBS Admin</h1>
          <p className="mt-1 text-sm text-text-secondary">Reset your password</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-elevated">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
            </div>
          ) : !isAuthenticated ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
              <p className="text-sm text-text-secondary">
                This link isn't valid — it may have expired or already been used. Request a new one from the sign in screen.
              </p>
              <Button variant="secondary" onClick={() => navigate("/admin/login")}>
                Back to sign in
              </Button>
            </div>
          ) : done ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="h-8 w-8 text-success" aria-hidden="true" />
              <p className="font-semibold text-text-primary">Password updated</p>
              <Button onClick={() => navigate("/admin/dashboard")}>Go to dashboard</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <label className="mb-4 flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-text-secondary">New password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <label className="mb-4 flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-text-secondary">Confirm password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>

              {error && <p className="mb-4 text-sm text-error">{error}</p>}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
