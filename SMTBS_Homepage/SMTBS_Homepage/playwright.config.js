import { defineConfig, devices } from "@playwright/test";

// Real end-to-end tests against a running dev server — no mocking, the same
// approach used to manually verify every phase of the Supabase migration
// throughout development. Requires a real .env (see .env.example) since
// these tests exercise the actual Supabase backend.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // Every spec file shares the same `tester` account and a finite seat
  // inventory — fullyParallel only orders tests within one file, so without
  // this, different files still run concurrently on separate workers and
  // race each other (confirmed: customer-booking and double-booking-guard
  // both timed out when run together at the default worker count).
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
