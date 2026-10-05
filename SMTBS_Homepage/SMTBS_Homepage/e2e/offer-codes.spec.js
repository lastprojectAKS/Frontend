import { test, expect } from "@playwright/test";
import { loginAsCustomer, selectDateWithShowtime, loadEnv, getAccessToken } from "./helpers.js";

// Creates a throwaway 10% offer that is valid every day, so the test never
// depends on what weekday the first showtime falls on. Applies a bogus code
// first to check the inline error, then the real one, completes a real
// Stripe test payment, and checks the database stored the discount. The
// offer and the booking are removed afterwards.
test("a promo code is validated at checkout and its discount is stored on the booking", async ({ page }) => {
  test.setTimeout(240_000);

  const env = loadEnv();
  await loginAsCustomer(page);
  const accessToken = await getAccessToken(page);
  const rest = `${env.VITE_SUPABASE_URL}/rest/v1`;
  const headers = {
    "Content-Type": "application/json",
    apikey: env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken}`,
  };

  const code = `E2E${Date.now().toString(36).toUpperCase()}`;
  const createRes = await fetch(`${rest}/offers`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({
      id: code.toLowerCase(),
      title: `E2E ${code}`,
      description: "Temporary offer created by the e2e suite.",
      discount: "10% OFF",
      validity: "Every day",
      code,
      discount_type: "percent",
      discount_value: 10,
      active: true,
    }),
  });
  expect(createRes.ok, `creating the test offer failed with status ${createRes.status}`).toBe(true);

  let bookingId = null;
  try {
    await page.goto("/movies/dune-part-two");
    await page.click("text=Book Tickets");
    await page.waitForURL(/\/booking\?movie=dune-part-two/);
    await page.waitForTimeout(700);
    await page.click("text=SMTBS Downtown");
    await page.waitForTimeout(700);
    await selectDateWithShowtime(page);
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
    const promoInput = page.locator("#promo-code");
    await expect(promoInput).toBeVisible({ timeout: 15_000 });
    const applyButton = page.getByRole("button", { name: "Apply", exact: true });

    await promoInput.fill("NOT-A-REAL-CODE");
    await applyButton.click();
    await expect(page.getByText("That promo code is not valid.")).toBeVisible({ timeout: 15_000 });

    await promoInput.fill(code);
    await applyButton.click();
    await expect(page.getByText("applied — you save")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(3000);

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
    const bookingCode = successBody.match(/BK-\d{5}/)?.[0];
    expect(bookingCode, "a real booking code should appear on the success page").toBeTruthy();

    const [booking] = await (
      await fetch(`${rest}/bookings?select=id,amount,offer_code,offer_discount&booking_code=eq.${bookingCode}`, { headers })
    ).json();
    bookingId = booking.id;
    expect(booking.offer_code).toBe(code);

    const seats = await (await fetch(`${rest}/booking_seats?select=price&booking_id=eq.${booking.id}`, { headers })).json();
    const subtotal = seats.reduce((sum, seat) => sum + Number(seat.price), 0);
    expect(subtotal).toBeGreaterThan(0);
    expect(Number(booking.offer_discount)).toBeCloseTo(subtotal * 0.1, 2);
    expect(Number(booking.amount)).toBeCloseTo(subtotal - subtotal * 0.1 + 2.5, 2);
  } finally {
    if (bookingId) {
      await fetch(`${rest}/rpc/cancel_booking`, {
        method: "POST",
        headers,
        body: JSON.stringify({ p_booking_id: bookingId }),
      });
    }
    await fetch(`${rest}/offers?code=eq.${code}`, { method: "DELETE", headers });
  }
});
