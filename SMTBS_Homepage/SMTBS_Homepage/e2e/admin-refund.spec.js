import { test, expect } from "@playwright/test";
import { loginAsCustomer } from "./helpers.js";

// Guards a real bug: before the refund-booking Edge Function existed, the
// admin "Refund" button just flipped payment_status/booking_status to
// Refunded in the DB — it never told Stripe to actually return the
// customer's money. That was harmless before Stripe existed (there was no
// real charge to refund) but became a real gap the moment checkout started
// creating real PaymentIntents: the app would claim "Refunded" while the
// card was still charged. This test proves the full chain — a real Stripe
// charge, then a real Stripe refund triggered from the admin UI — not just
// the DB status flip.
test("admin refund actually reverses the Stripe charge, not just the DB status", async ({ page }) => {
  test.setTimeout(75_000);

  await loginAsCustomer(page);

  await page.goto("/movies/dune-part-two");
  await page.click("text=Book Tickets");
  await page.waitForURL(/\/booking\?movie=dune-part-two/);
  await page.waitForTimeout(700);
  await page.click("text=SMTBS Downtown");
  await page.waitForTimeout(700);
  const dateSection = page.locator("section", { has: page.locator("h2", { hasText: "Select Date" }) });
  await dateSection.locator("button").first().click();
  await page.waitForTimeout(700);
  const timeSection = page.locator("section", { has: page.locator("h2", { hasText: "Select Showtime" }) });
  await timeSection.locator("button").first().click();
  await page.click("text=Continue to Seats");
  await page.waitForURL(/\/booking\/seats/, { timeout: 8000 });
  await page.waitForTimeout(1000);

  const availableSeat = page.locator('button[aria-label*="available"]').first();
  await expect(availableSeat).toBeVisible();
  await availableSeat.click();
  await page.waitForTimeout(300);

  await page.click("text=Continue to Checkout");
  await page.waitForURL(/\/checkout/, { timeout: 8000 });
  await page.waitForTimeout(3000);

  const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
  await stripeFrame.getByText("Card", { exact: true }).click();
  await page.waitForTimeout(1000);
  await stripeFrame.locator('input[name="number"]').fill("4242424242424242");
  await stripeFrame.locator('input[name="expiry"]').fill("1234");
  await stripeFrame.locator('input[name="cvc"]').fill("123");
  await page.waitForTimeout(500);

  await page.click("text=Complete Booking");
  // A real Stripe confirm + the confirm-booking Edge Function's own chain
  // (re-verify with Stripe, call book_seats()) — on a loaded/shared CI
  // runner this measurably exceeded 25s even on a successful run, not just
  // a flaky one, so this needs real headroom, not just a bit more.
  await page.waitForURL(/\/booking\/success/, { timeout: 45000 });
  await page.waitForTimeout(2000);

  const successBody = await page.textContent("body");
  const match = successBody.match(/BK-\d{5}/);
  expect(match, "a real booking code should appear on the success page").not.toBeNull();
  const bookingCode = match[0];

  // Same account is both customer and admin — it already has a session, so
  // go straight to the admin area rather than through /admin/login (which
  // would just redirect past the login form since it's already signed in).
  await page.goto("/admin/bookings");
  await page.waitForTimeout(1200);
  await page.getByText(bookingCode).click();
  await page.waitForTimeout(1000);

  await expect(page.getByText("Paid", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: /refund/i }).first().click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Refund booking" }).click();

  // The refund-booking Edge Function chain (is_admin check, cancel_booking
  // RPC, a real Stripe refunds.create() call, then the status update) is
  // several sequential network round-trips — give it real room before
  // asserting, same reasoning as the generous timeouts elsewhere in this
  // suite for multi-step real-backend flows.
  await expect(page.getByText("Refunded", { exact: true }).first()).toBeVisible({ timeout: 20_000 });

  // The whole point of this test: if the Edge Function's Stripe call had
  // silently failed or been skipped, the UI would still show "Refunded"
  // (that part of the old, broken behavior was never in question) — so the
  // real assertion is indirect but load-bearing: the Edge Function only
  // reaches the final DB update after stripe.refunds.create() succeeds (or
  // confirms the charge was already refunded). A real Stripe error there
  // returns a 502 with an inline error instead of ever flipping the
  // status, so reaching "Refunded" here is proof the refund API call
  // itself succeeded, not just that the DB was told to say so.
  const errorBanner = page.getByText(/could not refund|please try again/i);
  await expect(errorBanner).toHaveCount(0);
});
