import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginAsCustomer, loginAsAdmin, selectDateWithShowtime } from "./helpers.js";

// Automated WCAG 2 A/AA checks (axe-core) across representative pages in
// both themes. This is what actually found every color-contrast violation
// fixed in src/index.css — several brand/semantic colors cleared 4.5:1
// against a plain page background but fell short against their own
// 15%-opacity badge-pill backgrounds, the lightest (or, in dark mode,
// darkest) real case they appear against. Hand-checking one background
// per color would have missed that; this is why it's a real test, not a
// one-off script.
async function expectNoViolations(page) {
  // Without this, a movie card's hover-reveal overlay (opacity-0 ->
  // opacity-100 CSS transition on :hover) can get caught by axe mid-fade if
  // the mouse happens to be resting over a card, producing a transient,
  // non-reproducible-by-hand "insufficient contrast" result for colors that
  // don't match any real token (confirmed: the same page scanned with the
  // mouse moved away first is clean). 800ms (not 200) because a CI run
  // caught a second, different transient violation here too — a movie
  // card's Framer Motion entrance animation still mid-fade at the 200ms
  // mark on a slower/throttled runner (right at 4.46 vs the 4.5 threshold,
  // not a real token mismatch).
  await page.mouse.move(0, 0);
  await page.waitForTimeout(800);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.describe("Accessibility — light theme", () => {
  test.use({ colorScheme: "light" });

  test("Home", async ({ page }) => {
    await page.goto("/");
    // Longer than most other pages' pre-scan wait on purpose — Home has
    // several card grids (Now Showing, Coming Soon, Cinemas, Offers) with
    // staggered Framer Motion entrance animations; a CI run caught one
    // still fading in at 1000ms.
    await page.waitForTimeout(2500);
    await expectNoViolations(page);
  });

  test("Movies and Offers (badge/eyebrow-label contrast)", async ({ page }) => {
    await page.goto("/movies");
    await page.waitForTimeout(800);
    await expectNoViolations(page);
    await page.goto("/offers");
    await page.waitForTimeout(800);
    await expectNoViolations(page);
  });

  test("logged-in Profile", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/profile");
    await page.waitForTimeout(800);
    await expectNoViolations(page);
  });

  test("Admin Dashboard and Movies (sidebar active-link, status-badge contrast)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForTimeout(800);
    await expectNoViolations(page);
    await page.goto("/admin/movies");
    await page.waitForTimeout(800);
    await expectNoViolations(page);
  });

  test("Seat selection (VIP seat contrast)", async ({ page }) => {
    // This is the test that actually caught a real violation: the VIP seat
    // icon's warning-colored text against its own bg-warning/10 tint (a
    // *different* opacity than the /15 badge-pill tint the other warning/
    // success/error usages share), at 4.3:1 against the required 4.5:1.
    await loginAsCustomer(page);
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
    await expectNoViolations(page);
  });
});

test.describe("Accessibility — dark theme", () => {
  test.use({ colorScheme: "dark" });

  test("Home and Offers (dark-mode badge contrast)", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    await expectNoViolations(page);
    await page.goto("/offers");
    await page.waitForTimeout(800);
    await expectNoViolations(page);
  });

  test("Admin Movies (dark-mode status-badge contrast)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/movies");
    await page.waitForTimeout(800);
    await expectNoViolations(page);
  });
});
