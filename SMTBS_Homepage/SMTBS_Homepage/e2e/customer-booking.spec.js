import { test, expect } from "@playwright/test";
import { loginAsCustomer, selectDateWithShowtime } from "./helpers.js";

// Full real booking flow against the live Supabase backend — no mocking.
// Books a real seat, confirms it, then cancels it as cleanup so the suite
// stays idempotent (repeat runs don't slowly consume every seat on the
// showtime, and don't leave a trail of real bookings behind).
test("a customer can browse, book a real seat, and cancel it", async ({ page }) => {
  // This walks the full real journey against a live backend — login, movie,
  // cinema, date, showtime, seat map, a real Stripe test-mode payment,
  // book_seats(), profile, cancel_booking() — around a dozen real network
  // round-trips plus two Edge Function calls. The default 30s budget is
  // tight enough that a single slower Supabase round-trip can tip it over
  // even when every step succeeds (confirmed once: final state was fully
  // correct, just past the timeout) — bumped further for the two extra
  // Edge Function round-trips (possible cold start on Supabase's free tier).
  // Requires real Stripe test-mode credentials configured both locally
  // (VITE_STRIPE_PUBLISHABLE_KEY) and on the linked Supabase project
  // (STRIPE_SECRET_KEY secret) — see README's "Payments" section.
  test.setTimeout(150_000);

  await loginAsCustomer(page);

  await page.goto("/movies/dune-part-two");
  await page.click("text=Book Tickets");
  await page.waitForURL(/\/booking\?movie=dune-part-two/);
  await page.waitForTimeout(700);

  await page.click("text=SMTBS Downtown");
  await page.waitForTimeout(700);
  await selectDateWithShowtime(page);
  const timeSection = page.locator("section", { has: page.locator("h2", { hasText: "Select Showtime" }) });
  await timeSection.locator("button").first().click();
  await page.waitForTimeout(300);

  await page.click("text=Continue to Seats");
  await page.waitForURL(/\/booking\/seats/, { timeout: 8000 });
  await page.waitForTimeout(1000);

  const availableSeat = page.locator('button[aria-label*="available"]').first();
  await expect(availableSeat).toBeVisible();
  await availableSeat.click();
  await page.waitForTimeout(300);

  await page.click("text=Continue to Checkout");
  await page.waitForURL(/\/checkout/, { timeout: 8000 });
  await page.waitForTimeout(700);

  // Stripe's PaymentElement renders card fields inside a cross-origin
  // iframe (served from js.stripe.com) — Playwright can't fill these with
  // plain page.fill(). Verified empirically against a real render with real
  // Stripe test keys: with automatic_payment_methods enabled on an AUD
  // PaymentIntent, Stripe shows an accordion of methods (Card/Klarna/Zip,
  // etc. — varies by what the Stripe account has enabled) and "Card" must
  // be expanded before its number/expiry/cvc inputs exist in the DOM. All
  // three fields live in the same iframe, named "number"/"expiry"/"cvc".
  // This iframe name/structure is still not a stable public Stripe API —
  // if this test starts failing to find these locators after a Stripe.js
  // upgrade, re-verify with `page.pause()` right after PaymentElement
  // mounts rather than assuming the selectors below are still accurate.
  await page.waitForTimeout(3000); // let PaymentElement finish mounting
  const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
  await stripeFrame.getByText("Card", { exact: true }).click();
  await page.waitForTimeout(1000);
  await stripeFrame.locator('input[name="number"]').fill("4242424242424242");
  await stripeFrame.locator('input[name="expiry"]').fill("1234");
  await stripeFrame.locator('input[name="cvc"]').fill("123");
  await page.waitForTimeout(500);

  await page.click("text=Complete Booking");
  // A real Stripe confirm + the confirm-booking Edge Function's own chain
  // (re-verify with Stripe, call book_seats()) — confirmed on a real CI run
  // that this can genuinely take 45+ seconds end to end (Edge Function cold
  // starts, cross-region network to Stripe + Supabase from the runner), not
  // just occasionally flake at a tighter number. 100s / a 150s test budget
  // gives real room instead of guessing at another arbitrary bump.
  await page.waitForURL(/\/booking\/success/, { timeout: 100_000 });
  await page.waitForTimeout(2000);

  const successBody = await page.textContent("body");
  expect(successBody).toMatch(/BK-\d{5}/);

  // Cleanup: cancel the booking we just made so the suite is repeatable.
  await page.goto("/profile");
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Cancel booking" }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Confirm cancel" }).click();
  await page.waitForTimeout(1200);
  await expect(page.getByText("No upcoming bookings")).toBeVisible();
});

test("Booking a movie requires login — an anonymous visitor is prompted to sign in", async ({ page }) => {
  await page.goto("/booking?movie=dune-part-two");
  await page.waitForTimeout(800);
  await expect(page.getByText("Sign in to book tickets")).toBeVisible();
});
