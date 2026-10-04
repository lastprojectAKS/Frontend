import { loadStripe } from "@stripe/stripe-js";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Deliberately not a thrown error like supabaseClient.js's guard — every
// page needs Supabase, so crashing immediately there is correct. Only
// Checkout needs Stripe, and this module is imported eagerly (Checkout.jsx
// isn't lazy-loaded, same as every other customer page), so a top-level
// throw here would take down the entire site, not just the checkout route,
// whenever the key is unset. Checkout.jsx checks this for null instead and
// shows an inline error on just that page.
export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;
