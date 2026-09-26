import { test, expect } from "@playwright/test";
import { loginAsCustomer } from "./helpers.js";

// Full real booking flow against the live Supabase backend — no mocking.
// Books a real seat, confirms it, then cancels it as cleanup so the suite
// stays idempotent (repeat runs don't slowly consume every seat on the
// showtime, and don't leave a trail of real bookings behind).
test("a customer can browse, book a real seat, and cancel it", async ({ page }) => {
  // This walks the full real journey against a live backend — login, movie,
  // cinema, date, showtime, seat map, book_seats(), profile, cancel_booking()
  // — around a dozen real network round-trips. The default 30s budget is
  // tight enough that a single slower Supabase round-trip can tip it over
  // even when every step succeeds (confirmed once: final state was fully
  // correct, just past the timeout).
  test.setTimeout(60_000);

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

  await page.fill('input[type="text"][placeholder="class project"]', "E2E Test");
  await page.fill('input[type="email"]', "e2e-checkout@smtbs-test.com");
  await page.fill('input[type="tel"]', "5551234567");
  await page.fill('input[placeholder="4242 4242 4242 4242"]', "4242424242424242");
  await page.fill('input[placeholder="MM/YY"]', "12/28");
  await page.fill('input[placeholder="123"]', "123");
  await page.click("text=Complete Booking");
  await page.waitForURL(/\/booking\/success/, { timeout: 10000 });
  await page.waitForTimeout(1000);

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
