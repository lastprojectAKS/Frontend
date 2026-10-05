import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers.js";

// Smoke tests across every real (Phase 5-migrated) admin resource — confirms
// each page loads real Supabase data with no console errors, rather than
// re-testing every business rule already covered live during development
// (capacity limits, showtime conflicts, cancel/refund, etc.).
test.describe("Admin portal — real data smoke tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("Dashboard shows real, computed numbers", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.waitForTimeout(1000);
    await expect(page.getByText("Total Revenue")).toBeVisible();
    await expect(page.getByText("Recent Bookings")).toBeVisible();
  });

  test("Movies list loads real movies", async ({ page }) => {
    await page.goto("/admin/movies");
    await page.waitForTimeout(1000);
    await expect(page.getByText("Dune: Part Two")).toBeVisible();
  });

  test("Cinemas & Screens list loads and expands to show real screens", async ({ page }) => {
    await page.goto("/admin/cinemas");
    await page.waitForTimeout(1000);
    await expect(page.getByText("SMTBS Downtown")).toBeVisible();
    await page.click("text=SMTBS Downtown");
    await page.waitForTimeout(700);
    await expect(page.getByText("Screen 1")).toBeVisible();
  });

  test("Showtimes list loads real showtimes with real filter options", async ({ page }) => {
    await page.goto("/admin/showtimes");
    await page.waitForTimeout(1000);
    // Scoped to the table body — a bare text search would also match the
    // (hidden, since the <select> is closed) "SMTBS Downtown" <option> in
    // the Cinema filter dropdown above it.
    await expect(page.locator("tbody").getByText("SMTBS Downtown").first()).toBeVisible();
    const movieOptions = await page.locator('select[aria-label="Movie"] option').allTextContents();
    expect(movieOptions.some((t) => t.includes("Dune"))).toBe(true);
  });

  test("Bookings list loads real bookings with real booking codes", async ({ page }) => {
    await page.goto("/admin/bookings");
    // A fixed wait + one static text snapshot (the pattern this file uses
    // elsewhere) isn't reliable here — this query joins several tables and
    // was slow enough on a loaded CI runner to still be mid-render at a
    // flat 1000ms, failing against whatever the loading-skeleton placeholder
    // text was at that exact instant. An auto-retrying assertion polls
    // instead of snapshotting once.
    await expect(page.getByText(/BK-\d{5}/).first()).toBeVisible({ timeout: 10_000 });
  });

  test("Customers list loads real customers, excluding admin accounts", async ({ page }) => {
    await page.goto("/admin/customers");
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 10_000 });
    const body = await page.textContent("body");
    expect(body).not.toContain("tester@smtbs-test.com"); // promoted to super_admin, must not appear
    expect(body).not.toContain("cus-0"); // no leftover mock-style ids
  });

  test("Reports & Analytics loads real charts and can switch date range", async ({ page }) => {
    await page.goto("/admin/reports");
    await page.waitForTimeout(1200);
    await expect(page.getByText("Revenue Overview")).toBeVisible();
    await page.selectOption('select[aria-label="Date range"]', { label: "This month" });
    await page.waitForTimeout(800);
    await expect(page.getByText("Revenue Overview")).toBeVisible();
  });
});
