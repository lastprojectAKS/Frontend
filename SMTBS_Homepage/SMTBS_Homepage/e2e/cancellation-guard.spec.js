import { test, expect } from "@playwright/test";
import { loginAsCustomer, loadEnv, getAccessToken, serverBookSeats } from "./helpers.js";

// Checks the cancel-booking function's refusal when cancelling would take the
// balance below zero. The booking is made through book_seats() with no payment
// id, so no charge or refund is involved. The points "spent elsewhere" are
// simulated by lowering the balance, which the test account can do because it
// is a super admin. The showtime is at least two days out so the 2-hour cutoff
// doesn't interfere.
test("cancelling is refused while the points it earned are spent, and allowed once they are back", async ({ page }) => {
  test.setTimeout(120_000);

  const env = loadEnv();
  await loginAsCustomer(page);
  const accessToken = await getAccessToken(page);
  const userId = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString()).sub;
  const rest = `${env.VITE_SUPABASE_URL}/rest/v1`;
  const headers = {
    "Content-Type": "application/json",
    apikey: env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken}`,
  };

  async function getPoints() {
    const [row] = await (await fetch(`${rest}/profiles?select=loyalty_points&id=eq.${userId}`, { headers })).json();
    return row.loyalty_points;
  }

  async function setPoints(value) {
    const res = await fetch(`${rest}/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ loyalty_points: value }),
    });
    expect(res.ok, `setting the test balance failed with status ${res.status}`).toBe(true);
  }

  async function cancel(bookingId) {
    const res = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/cancel-booking`, {
      method: "POST",
      headers,
      body: JSON.stringify({ bookingId }),
    });
    return { ok: res.ok, body: await res.json() };
  }

  const twoDaysAhead = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [showtime] = await (
    await fetch(
      `${rest}/showtimes?select=id&movie_id=eq.dune-part-two&cinema_id=eq.downtown&status=eq.Scheduled&show_date=gte.${twoDaysAhead}&order=show_date&limit=1`,
      { headers }
    )
  ).json();
  expect(showtime, "a scheduled showtime at least two days out should exist for this test").toBeTruthy();

  const startingPoints = await getPoints();
  let booking = null;
  for (const row of "ABCDEFGHIJ") {
    for (let seat = 1; seat <= 10 && !booking; seat++) {
      const res = await serverBookSeats(env, {
        p_customer: userId,
        p_showtime_id: showtime.id,
        p_seat_labels: [`${row}${seat}`],
        p_points_redeemed: 0,
        p_offer_code: null,
      });
      if (res.status === 200) booking = res.body;
    }
    if (booking) break;
  }
  expect(booking, "a free seat should have been found for the test booking").toBeTruthy();

  const earned = Math.floor(Number(booking.amount));
  let cancelled = false;
  try {
    expect(await getPoints()).toBe(startingPoints + earned);

    await setPoints(0);
    const refused = await cancel(booking.id);
    expect(refused.ok, "cancelling should be refused while the earned points are spent").toBe(false);
    expect(refused.body.error).toContain("already been spent");
    expect(await getPoints()).toBe(0);

    await setPoints(startingPoints + earned);
    const allowed = await cancel(booking.id);
    expect(allowed.ok, `cancelling should succeed once the points are back: ${JSON.stringify(allowed.body)}`).toBe(true);
    cancelled = true;
    expect(await getPoints()).toBe(startingPoints);
  } finally {
    if (!cancelled) {
      await setPoints(startingPoints + earned);
      await cancel(booking.id);
    }
  }
});
