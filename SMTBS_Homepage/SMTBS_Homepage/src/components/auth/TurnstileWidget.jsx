import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

let scriptPromise;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

// Renders nothing when no site key is configured, so local development works
// without Turnstile.
export default function TurnstileWidget({ onToken }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return undefined;
    let widgetId;
    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });
      })
      .catch(() => onToken(""));

    return () => {
      cancelled = true;
      if (widgetId !== undefined && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} className="flex justify-center" />;
}

export const turnstileEnabled = Boolean(SITE_KEY);
