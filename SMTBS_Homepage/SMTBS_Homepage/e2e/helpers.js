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
