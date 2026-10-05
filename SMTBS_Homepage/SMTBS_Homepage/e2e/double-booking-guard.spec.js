import { test, expect } from "@playwright/test";
import { loginAsCustomer, selectDateWithShowtime, loadEnv, getAccessToken } from "./helpers.js";

// Mirrors resolve_seat_category()'s row-block layout (supabase/migrations/
// 0007) to compute the very last seat on a screen — the seat least likely to
// collide with a real customer's booking, which naturally starts from the
// front. 10 seats/row, Standard rows first, then Premium, then VIP.
function lastSeatLabel(categories) {
  const order = ["Standard", "Premium", "VIP"];
  const rows = [];
  let rowIndex = 0;
  for (const name of order) {
    const cat = categories.find((c) => c.category === name);
    if (!cat) continue;
    let remaining = cat.seat_count;
    while (remaining > 0) {
      const seatsInRow = Math.min(10, remaining);
      rows.push({ row: rowIndex, count: seatsInRow });
      remaining -= seatsInRow;
      rowIndex += 1;
    }
  }
  const last = rows[rows.length - 1];
  const rowLetter = String.fromCharCode("A".charCodeAt(0) + last.row);
  return `${rowLetter}${last.count}`;
}

// This is the real, load-bearing test in the whole suite: it proves seat
// double-booking is impossible at the *database* level (a partial unique
// index on booking_seats(showtime_id, seat_label) where status='confirmed'
// — see supabase/migrations/0007), not just prevented by the UI graying out
// a taken seat. It calls the book_seats() RPC directly, bypassing the seat
// picker entirely, the same way a race condition or a malicious client
// would.
test("the database rejects a duplicate seat booking on the same showtime", async ({ page }) => {
  test.setTimeout(60_000); // same navigation-heavy path as customer-booking.spec.js, plus two direct RPC calls

  const env = loadEnv();

  await loginAsCustomer(page);

  // Navigate the real booking flow just far enough to land on a real
  // showtime's seat map, capturing the real showtimeId/screenId Supabase
  // actually used (deterministic seed assignment means we can't assume
  // which screen this lands on).
  let showtimeId = null;
  let screenId = null;
  page.on("request", (req) => {
    const url = req.url();
    const stMatch = url.match(/showtimes\?select=price&id=eq\.([0-9a-f-]{36})/);
    if (stMatch) showtimeId = stMatch[1];
    const scMatch = url.match(/screen_seat_categories\?select=[^&]*&screen_id=eq\.([\w-]+)/);
    if (scMatch) screenId = scMatch[1];
  });

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

  expect(showtimeId, "should have captured a real showtime id from the network").toBeTruthy();
  expect(screenId, "should have captured a real screen id from the network").toBeTruthy();

  const categoriesRes = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/screen_seat_categories?select=category,seat_count&screen_id=eq.${screenId}`, {
    headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` },
  });
  const categories = await categoriesRes.json();
  const seatLabel = lastSeatLabel(categories);

  const accessToken = await getAccessToken(page);

  async function callBookSeats() {
    const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/rpc/book_seats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ p_showtime_id: showtimeId, p_seat_labels: [seatLabel] }),
    });
    const body = await res.json();
    return { status: res.status, body };
  }

  const first = await callBookSeats();
  expect(first.status, `first booking of a genuinely free seat should succeed: ${JSON.stringify(first.body)}`).toBe(200);

  const second = await callBookSeats();
  expect(second.status).toBe(400);
  expect(second.body.message).toMatch(/just booked by someone else/i);

  // Cleanup: release the seat we just booked so the test is repeatable.
  await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/cancel-booking`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ bookingId: first.body.id }),
  });
});
