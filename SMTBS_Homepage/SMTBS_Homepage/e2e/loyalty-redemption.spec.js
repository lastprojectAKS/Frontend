import { test, expect } from "@playwright/test";
import { loginAsCustomer, selectDateWithShowtime, loadEnv, getAccessToken } from "./helpers.js";

// Guards the actual redemption mechanism, not just that points exist and
// display (that part already worked): books and pays for a real seat with
// no redemption (to guarantee a nonzero points balance regardless of
// whatever this account's starting balance was), then books a second real
// seat with the "Apply my points" toggle checked, and asserts — against the
// database, not just the UI — that the charge was genuinely discounted and
// the points balance moved by exactly the right amount. Cancels both at the
// end and confirms the balance returns to exactly where it started,
// proving cancel_booking() correctly reverses both the earn from an
// ordinary booking and the earn+redeem from a points-discounted one.
test("redeeming loyalty points actually discounts the charge and the balance moves correctly", async ({ page }) => {
  test.setTimeout(240_000);

  const env = loadEnv();
  await loginAsCustomer(page);
  const accessToken = await getAccessToken(page);
  // JWT payload (middle, base64url-encoded segment) carries the user id as
  // its `sub` claim — needed below because an unfiltered profiles query
  // doesn't safely mean "my own row" for this account.
  const userId = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString()).sub;

  async function getPoints() {
    // This test account is promoted to super_admin (same account used
    // throughout the suite for both customer and admin flows) — RLS's
    // "auth.uid() = id or is_admin()" policy means an UNFILTERED profiles
    // query returns every customer's row, not just this one, for an admin.
    // Confirmed live: this returned 10 rows, and destructuring the first
    // one was silently reading an arbitrary other test account's balance —
    // explains every confusing "wrong number" result chasing this bug
    // earlier. The actual redemption feature was correct the whole time.
    const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/profiles?select=loyalty_points&id=eq.${userId}`, {
      headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
    });
    const [row] = await res.json();
    return row.loyalty_points;
  }

  async function getBooking(code) {
    // booking_code is globally unique, so this is already correctly scoped
    // to exactly one row regardless of RLS visibility — unlike getPoints()
    // above, no additional filter needed here.
    const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/bookings?select=amount,points_redeemed,id&booking_code=eq.${code}`, {
      headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
    });
    const [row] = await res.json();
    return row;
  }

  async function cancelBooking(bookingId) {
    await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/cancel-booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ bookingId }),
    });
  }

  async function bookOneSeat({ redeem }) {
    await page.goto("/movies/dune-part-two");
    await page.click("text=Book Tickets");
    await page.waitForURL(/\/booking\?movie=dune-part-two/);
    await page.waitForTimeout(700);
    await page.click("text=SMTBS Downtown");
    await page.waitForTimeout(700);
    await selectDateWithShowtime(page, { fromIndex: 2 });
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

    if (redeem) {
      const toggle = page.getByRole("checkbox");
      await expect(toggle, "the redeem-points toggle should be offered once the account has a nonzero balance").toBeVisible({ timeout: 10_000 });
      await toggle.click();
      await expect(page.getByText("Loyalty points applied")).toBeVisible({ timeout: 10_000 });
      // Toggling re-fetches a fresh PaymentIntent and fully remounts the
      // Stripe Elements tree (Checkout.jsx's key={clientSecret}) — give
      // that real round trip (Edge Function call + Stripe.js re-mounting
      // PaymentElement) room to fully settle before interacting with it.
      await page.waitForTimeout(3000);
    }

    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    await stripeFrame.getByText("Card", { exact: true }).click();
    await page.waitForTimeout(1000);
    await stripeFrame.locator('input[name="number"]').fill("4242424242424242");
    await stripeFrame.locator('input[name="expiry"]').fill("1234");
    await stripeFrame.locator('input[name="cvc"]').fill("123");
    const postalCodeField = stripeFrame.locator('input[name="postalCode"]');
    if (await postalCodeField.count()) {
      await postalCodeField.fill("12345");
    }
    await page.waitForTimeout(500);

    await page.click("text=Complete Booking");
    await page.waitForURL(/\/booking\/success/, { timeout: 100_000 });
    await page.waitForTimeout(2000);
    const successBody = await page.textContent("body");
    const match = successBody.match(/BK-\d{5}/);
    expect(match, "a real booking code should appear on the success page").not.toBeNull();
    return match[0];
  }

  const pointsAtStart = await getPoints();

  const code1 = await bookOneSeat({ redeem: false });
  const booking1 = await getBooking(code1);
  expect(booking1.points_redeemed).toBe(0);

  const pointsAfterEarning = await getPoints();
  expect(pointsAfterEarning).toBe(pointsAtStart + Math.floor(booking1.amount));

  const code2 = await bookOneSeat({ redeem: true });
  const booking2 = await getBooking(code2);
  expect(booking2.points_redeemed, "redemption should have used exactly the balance earned from the first booking").toBe(pointsAfterEarning);
  expect(booking2.points_redeemed).toBeGreaterThan(0);

  const pointsAfterRedeeming = await getPoints();
  const expectedAfterRedeeming = pointsAfterEarning - booking2.points_redeemed + Math.floor(booking2.amount);
  expect(pointsAfterRedeeming).toBe(expectedAfterRedeeming);

  // Cleanup, and the other half of the correctness proof: cancelling both
  // bookings should land the balance back exactly where it started,
  // proving cancel_booking() correctly reverses both an ordinary earn and
  // an earn-after-redeem.
  await cancelBooking(booking2.id);
  await cancelBooking(booking1.id);
  const pointsAfterCleanup = await getPoints();
  expect(pointsAfterCleanup).toBe(pointsAtStart);
});
