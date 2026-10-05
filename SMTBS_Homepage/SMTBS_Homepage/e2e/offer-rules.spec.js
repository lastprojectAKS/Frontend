import { test, expect } from "@playwright/test";
import { loginAsCustomer, loadEnv, getAccessToken } from "./helpers.js";

// Checks quote_booking()'s offer validation directly against the live
// database. Each case makes its own temporary offer and removes it afterwards.
// Quotes don't create bookings, so nothing here touches seats or points.
test.describe("Offer rules at quote time", () => {
  let rest;
  let headers;
  let showtime;

  test.beforeEach(async ({ page }) => {
    const env = loadEnv();
    await loginAsCustomer(page);
    const accessToken = await getAccessToken(page);
    rest = `${env.VITE_SUPABASE_URL}/rest/v1`;
    headers = {
      "Content-Type": "application/json",
      apikey: env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    };
    const today = new Date().toISOString().slice(0, 10);
    const [row] = await (
      await fetch(
        `${rest}/showtimes?select=id,show_date&movie_id=eq.dune-part-two&cinema_id=eq.downtown&status=eq.Scheduled&show_date=gte.${today}&order=show_date&limit=1`,
        { headers }
      )
    ).json();
    expect(row, "a future scheduled showtime should exist for these tests").toBeTruthy();
    showtime = row;
  });

  async function createOffer(fields) {
    const code = `E2E${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const res = await fetch(`${rest}/offers`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({
        id: code.toLowerCase(),
        title: `E2E ${code}`,
        description: "Temporary offer for the e2e rule tests.",
        discount: "10% OFF",
        validity: "Test only",
        code,
        discount_type: "percent",
        discount_value: 10,
        active: true,
        ...fields,
      }),
    });
    expect(res.ok, `creating the test offer failed with status ${res.status}`).toBe(true);
    return code;
  }

  async function quote(code) {
    const res = await fetch(`${rest}/rpc/quote_booking`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        p_showtime_id: showtime.id,
        p_seat_labels: ["A1"],
        p_redeem_points: false,
        p_offer_code: code,
      }),
    });
    return { ok: res.ok, body: await res.json() };
  }

  async function deleteOffer(code) {
    await fetch(`${rest}/offers?code=eq.${code}`, { method: "DELETE", headers });
  }

  // Parsed from the date string directly so the local timezone can't shift it.
  const showDow = () => new Date(`${showtime.show_date}T00:00:00Z`).getUTCDay();
  const shiftDays = (days) => {
    const d = new Date(`${showtime.show_date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };

  test("a valid code applies and reduces the quoted total", async () => {
    const code = await createOffer({ days_of_week: null, valid_from: null, valid_until: null });
    try {
      const { ok, body } = await quote(code);
      expect(ok).toBe(true);
      expect(body.offerCode).toBe(code);
      expect(body.offerDiscount).toBeGreaterThan(0);
    } finally {
      await deleteOffer(code);
    }
  });

  test("a code used on a day it isn't valid for is rejected", async () => {
    const wrongDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => d !== showDow());
    const code = await createOffer({ days_of_week: wrongDays });
    try {
      const { ok, body } = await quote(code);
      expect(ok).toBe(false);
      expect(body.message).toContain("day of the week");
    } finally {
      await deleteOffer(code);
    }
  });

  test("a code used after its end date is rejected", async () => {
    const code = await createOffer({ valid_until: shiftDays(-1) });
    try {
      const { ok, body } = await quote(code);
      expect(ok).toBe(false);
      expect(body.message).toContain("this showtime's date");
    } finally {
      await deleteOffer(code);
    }
  });

  test("an inactive code is rejected", async () => {
    const code = await createOffer({ active: false });
    try {
      const { ok, body } = await quote(code);
      expect(ok).toBe(false);
      expect(body.message).toBe("That promo code is not valid.");
    } finally {
      await deleteOffer(code);
    }
  });
});
