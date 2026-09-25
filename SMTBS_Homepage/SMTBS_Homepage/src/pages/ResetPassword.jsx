import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, KeyRound } from "lucide-react";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "h-11 rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent";

// Landed on via the link in a password-reset email. Supabase's client
// auto-detects the recovery token in the URL and turns it into a real
// session before this component even mounts (detectSessionInUrl) — isLoggedIn
// being true here IS the proof the link was valid, no separate check needed.
export default function ResetPassword() {
  const { isLoggedIn, loading, updatePassword } = useAuth();
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold text-text-primary">This link isn't valid</h1>
        <p className="text-text-secondary">Password reset links expire after a while, or may have already been used. Request a new one from the log in screen.</p>
        <Button onClick={() => navigate("/")}>Back to home</Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Password updated</h1>
        <p className="text-text-secondary">You're signed in with your new password.</p>
        <Button onClick={() => navigate("/profile")}>Go to my profile</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-text-primary">Set a new password</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-text-secondary">New password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-text-secondary">Confirm password</span>
          <input
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className={inputClass}
          />
        </label>

        {error && <p className="text-sm text-error">{error}</p>}

        <Button type="submit" className="mt-1 w-full" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Update password"}
        </Button>
      </form>
    </div>
  );
}
