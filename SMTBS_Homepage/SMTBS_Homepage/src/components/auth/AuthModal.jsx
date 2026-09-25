import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const inputClass =
  "h-11 rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent";

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

export default function AuthModal() {
  const { authModal, closeAuthModal, login, signup, sendPhoneOtp, verifyPhoneOtp, loginWithGoogle, requestPasswordReset } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState(authModal.mode);
  const [method, setMethod] = useState("email");

  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState("enter");

  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    if (authModal.open) {
      setMode(authModal.mode);
      setMethod("email");
      setPhoneStep("enter");
      setPhone("");
      setOtp("");
      setError("");
      setForgotSent(false);
    }
  }, [authModal.open, authModal.mode]);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;

    setSubmitting(true);
    setError("");

    const result =
      mode === "login" ? await login({ email, password }) : await signup({ name: form.name.value, email, password });

    setSubmitting(false);

    if (!result.success) {
      setError(result.error || "Something went wrong. Please try again.");
      return;
    }

    showToast(mode === "login" ? "Welcome back!" : `Account created — welcome, ${form.name.value || "there"}!`);
    closeAuthModal();
    form.reset();
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await sendPhoneOtp(phone);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || "Couldn't send that code. Check the number and try again.");
      return;
    }
    setPhoneStep("verify");
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await verifyPhoneOtp(phone, otp);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || "That code didn't work. Check it and try again.");
      return;
    }
    showToast("Welcome!");
    closeAuthModal();
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    const email = e.target.email.value;
    setSubmitting(true);
    setError("");
    const result = await requestPasswordReset(email);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || "Couldn't send that email. Please try again.");
      return;
    }
    setForgotSent(true);
  }

  async function handleGoogle() {
    setGoogleSubmitting(true);
    setError("");
    const result = await loginWithGoogle();
    // On success this navigates away to Google immediately — setGoogleSubmitting(false)
    // only actually matters for the failure path, since the page won't repaint otherwise.
    if (!result.success) {
      setGoogleSubmitting(false);
      setError(result.error || "Couldn't start Google sign-in. Please try again.");
    }
  }

  if (mode === "forgot") {
    return (
      <Modal open={authModal.open} onClose={closeAuthModal} title="Reset your password" size="sm">
        {forgotSent ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-text-secondary">
              If an account exists for that email, we've sent a link to reset your password. Check your inbox.
            </p>
            <button type="button" onClick={() => setMode("login")} className="text-sm font-semibold text-accent-text hover:underline">
              Back to log in
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-text-secondary">Email</span>
              <input name="email" required type="email" placeholder="you@example.com" autoComplete="email" className={inputClass} />
            </label>

            {error && <p className="text-sm text-error">{error}</p>}

            <Button type="submit" className="mt-1 w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Send reset link"}
            </Button>

            <button type="button" onClick={() => setMode("login")} className="text-center text-sm font-semibold text-accent-text hover:underline">
              Back to log in
            </button>
          </form>
        )}
      </Modal>
    );
  }

  return (
    <Modal
      open={authModal.open}
      onClose={closeAuthModal}
      title={method === "email" ? (mode === "login" ? "Sign in" : "Create your account") : "Sign in with phone"}
      size="sm"
    >
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={googleSubmitting}
        onClick={handleGoogle}
      >
        {googleSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <GoogleIcon />}
        Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3 text-xs font-medium text-text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="mb-5 flex rounded-lg border border-border-strong p-0.5">
        {[
          { value: "email", label: "Email" },
          { value: "phone", label: "Phone" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setMethod(tab.value);
              setError("");
            }}
            className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors ${
              method === tab.value ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {method === "email" ? (
        <form key={mode} onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-text-secondary">Full Name</span>
              <input name="name" required type="text" placeholder="Jordan Avery" autoComplete="name" className={inputClass} />
            </label>
          )}

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-text-secondary">Email</span>
            <input name="email" required type="email" placeholder="you@example.com" autoComplete="email" className={inputClass} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-text-secondary">Password</span>
            <input
              name="password"
              required
              type="password"
              minLength={6}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className={inputClass}
            />
          </label>

          {mode === "login" && (
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="-mt-2 self-end text-xs font-semibold text-accent-text hover:underline"
            >
              Forgot password?
            </button>
          )}

          {error && <p className="text-sm text-error">{error}</p>}

          <Button type="submit" className="mt-1 w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : mode === "login" ? "Log In" : "Create Account"}
          </Button>
        </form>
      ) : phoneStep === "enter" ? (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-text-secondary">Phone number</span>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+61 4XX XXX XXX"
              autoComplete="tel"
              className={inputClass}
            />
            <span className="text-xs text-text-muted">Include your country code, e.g. +61 for Australia.</span>
          </label>

          {error && <p className="text-sm text-error">{error}</p>}

          <Button type="submit" className="mt-1 w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Send code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-text-secondary">Enter the code sent to {phone}</span>
            <input
              required
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className={`${inputClass} tracking-[0.3em]`}
            />
          </label>

          {error && <p className="text-sm text-error">{error}</p>}

          <Button type="submit" className="mt-1 w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Verify & continue"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setPhoneStep("enter");
              setOtp("");
              setError("");
            }}
            className="text-center text-sm font-semibold text-accent-text hover:underline"
          >
            Use a different number
          </button>
        </form>
      )}

      {method === "email" && (
        <p className="mt-5 text-center text-sm text-text-secondary">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-semibold text-accent-text hover:underline"
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      )}
    </Modal>
  );
}
