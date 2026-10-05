import { test, expect } from "@playwright/test";
import { loginAsCustomer, selectDateWithShowtime, loadEnv, getAccessToken } from "./helpers.js";

test("a seat booked elsewhere is occupied, and a freed seat becomes selectable, on an open seat map", async ({ page }) => {
  test.setTimeout(180_000);
  const env = loadEnv();
  await loginAsCustomer(page);
  const accessToken = await getAccessToken(page);
  const headers = { "Content-Type": "application/json", apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` };

  await page.goto("/movies/dune-part-two");
  await page.click("text=Book Tickets");
  await page.waitForURL(/\/booking\?movie=dune-part-two/);
  await page.waitForTimeout(700);
  await page.click("text=SMTBS Downtown");
  await page.waitForTimeout(700);
  await selectDateWithShowtime(page, { fromIndex: 2 });
  const timeSection = page.locator("section", { has: page.locator("h2", { hasText: "Select Showtime" }) });
  await timeSection.locator("button").first().click();
  const seatRequest = page.waitForRequest((r) => r.url().includes("get_seat_occupancy"));
  await page.click("text=Continue to Seats");
  const showtimeId = JSON.parse((await seatRequest).postData()).p_showtime_id;
  await page.waitForURL(/\/booking\/seats/, { timeout: 8000 });
  await page.waitForTimeout(4000);

  const free = page.locator('button[aria-label*="available"]').first();
  await expect(free).toBeVisible();
  const seatId = (await free.getAttribute("aria-label")).match(/Seat ([A-Z]\d+)/)[1];
  const seat = page.locator(`button[aria-label^="Seat ${seatId}"]`).first();

  const booked = await (
    await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/rpc/book_seats`, {
      method: "POST",
      headers,
      body: JSON.stringify({ p_showtime_id: showtimeId, p_seat_labels: [seatId], p_points_redeemed: 0, p_offer_code: null }),
    })
  ).json();
  await expect(seat).toBeDisabled({ timeout: 15_000 });

  const cancel = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/cancel-booking`, {
    method: "POST",
    headers,
    body: JSON.stringify({ bookingId: booked.id }),
  });
  expect(cancel.ok, await cancel.clone().text()).toBe(true);
  await expect(seat).toBeEnabled({ timeout: 15_000 });
});
