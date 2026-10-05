const KEY = "smtbs.pendingPromo";

// Carries an offer code from the Offers page to checkout, which may be a few
// pages away in the booking flow. Session-scoped and best-effort: if storage
// is unavailable the customer just types the code by hand.
export function setPendingPromo(code) {
  try {
    sessionStorage.setItem(KEY, code);
  } catch {
    // Storage blocked — checkout simply starts with an empty promo field.
  }
}

export function readPendingPromo() {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function clearPendingPromo() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
}
