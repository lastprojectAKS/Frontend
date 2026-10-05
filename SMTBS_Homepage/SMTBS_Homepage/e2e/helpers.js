// Shared fixtures for the E2E suite — not a spec file itself, since
// Playwright doesn't allow multiple spec files to import from another spec
// file (it treats every *.spec.js as a standalone entry point).
//
// Fixed, pre-confirmed accounts (created once via Supabase dashboard →
// Auto Confirm User, not signup) — reused across the suite instead of
// signing up fresh every run, since Supabase's shared email-sending has a
// real rate limit that repeated signup runs would exhaust.
export const CUSTOMER_EMAIL = "tester@smtbs-test.com";
export const CUSTOMER_PASSWORD = "TestPass123";
export const ADMIN_EMAIL = "tester@smtbs-test.com"; // same account, promoted to super_admin
export const ADMIN_PASSWORD = "TestPass123";

export async function loginAsCustomer(page) {
  await page.goto("/");
  await page.click("text=Login");
  await page.waitForTimeout(300);
  await page.fill('input[name="email"]', CUSTOMER_EMAIL);
  await page.fill('input[name="password"]', CUSTOMER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
}

export async function loginAsAdmin(page) {
  await page.goto("/admin/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 8000 });
}

// Clicking the date picker's first button isn't safe to assume has a
// showtime — movies are assigned to specific cinema/date/slot combos by a
// deterministic hash (see supabase/migrations/0013), not scheduled at
// every cinema every day. Confirmed as a real flake: the booking flow's
// "first date" genuinely had no Dune showing at Downtown on a given day
// even though Dune had showtimes elsewhere in the same date range.
//
// The "3. Select Showtime" <section> itself always renders once a date is
// picked (Booking.jsx) — it's the CONTENT that varies: a loading spinner,
// an "No showtimes available" EmptyState, or real buttons. Checking the
// section's own visibility (an earlier version of this helper did) always
// returns true and proves nothing; this checks for an actual button
// appearing inside it instead, which is the only state that means a
// showtime genuinely exists on that date.
export async function selectDateWithShowtime(page) {
  const dateSection = page.locator("section", { has: page.locator("h2", { hasText: "Select Date" }) });
  const dateButtons = dateSection.locator("button");
  const count = await dateButtons.count();
  const timeSection = page.locator("section", { has: page.locator("h2", { hasText: "Select Showtime" }) });
  const showtimeButton = timeSection.locator("button").first();

  for (let i = 0; i < count; i++) {
    await dateButtons.nth(i).click();
    try {
      await showtimeButton.waitFor({ state: "visible", timeout: 3000 });
      return;
    } catch {
      // This date has no showtime (empty-state shown instead) — try the next one.
    }
  }
  throw new Error("No date in the picker had an available showtime for this movie/cinema.");
}
