import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function AuthModal() {
  const { authModal, closeAuthModal, login, signup } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState(authModal.mode);

  useEffect(() => {
    if (authModal.open) setMode(authModal.mode);
  }, [authModal.open, authModal.mode]);

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;

    if (mode === "login") {
      login({ email });
      showToast("Welcome back!");
    } else {
      const name = form.name.value;
      signup({ name, email });
      showToast(`Account created — welcome, ${name || "there"}!`);
    }

    closeAuthModal();
    form.reset();
  }

  return (
    <Modal
      open={authModal.open}
      onClose={closeAuthModal}
      title={mode === "login" ? "Sign in" : "Create your account"}
      size="sm"
    >
      <p className="mb-5 rounded-lg bg-bg-secondary px-3.5 py-2.5 text-xs text-text-secondary">
        Demo only — no account is created or stored on a server.
      </p>

      <form key={mode} onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "signup" && (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-text-secondary">Full Name</span>
            <input
              name="name"
              required
              type="text"
              placeholder="Jordan Avery"
              autoComplete="name"
              className="h-11 rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-text-secondary">Email</span>
          <input
            name="email"
            required
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="h-11 rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
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
            className="h-11 rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <Button type="submit" className="mt-1 w-full">
          {mode === "login" ? "Log In" : "Create Account"}
        </Button>
      </form>

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
    </Modal>
  );
}
