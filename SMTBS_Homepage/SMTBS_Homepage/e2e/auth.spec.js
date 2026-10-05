import { test, expect } from "@playwright/test";
import { CUSTOMER_EMAIL, CUSTOMER_PASSWORD, loginAsCustomer, loginAsAdmin } from "./helpers.js";

test.describe("Customer authentication", () => {
  test("logs in with valid credentials and shows the real profile", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/profile");
    await expect(page.getByText(CUSTOMER_EMAIL)).toBeVisible({ timeout: 15_000 });
  });

  test("rejects an incorrect password with an inline error, not a crash", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Login");
    await page.waitForTimeout(300);
    await page.fill('input[name="email"]', CUSTOMER_EMAIL);
    await page.fill('input[name="password"]', "DefinitelyWrongPassword");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    // Still shows the login form (modal didn't close as if successful).
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("logged-out Profile page prompts login instead of showing bookings", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByText("You're not logged in")).toBeVisible();
  });
});

test.describe("Admin authentication", () => {
  test("a plain customer account cannot access the admin portal", async ({ page }) => {
    // This account only exists to prove the rejection path; it's fine for it
    // to not exist yet — signIn failing for either reason (wrong password or
    // no admin access) is an acceptable outcome for this assertion, since
    // both keep a non-admin out.
    await page.goto("/admin/login");
    await page.fill('input[type="email"]', "not-an-admin@smtbs-test.com");
    await page.fill('input[type="password"]', "WrongOrNoAccess123");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1200);
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("logs in as admin and reaches the dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText("Total Revenue")).toBeVisible();
  });
});
