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
  // Default 5s is too tight on a shared/throttled CI runner for toBeVisible()
  // assertions following a real Supabase round-trip — confirmed by a CI run
  // where the admin dashboard's own "Total Revenue" text genuinely hadn't
  // rendered yet at 5s, not just occasionally flaking.
  expect: {
    timeout: process.env.CI ? 15_000 : 5_000,
  },
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // body has `transition: background-color 0.25s ease, color 0.25s ease`
    // (index.css), and ThemeContext sets the data-theme attribute inside a
    // useEffect, not during the initial render — so there's a real window
    // right after mount where different elements' background/text colors
    // can be mid-transition between theme values at the exact moment axe
    // samples them. Caught a false "insufficient contrast" violation this
    // way in CI: background had already finished transitioning to light
    // while a sibling element's text color hadn't. Same class of issue
    // expectNoViolations() already works around for hover-fade overlays
    // (see accessibility.spec.js) — this generalizes it to theme-switch
    // transitions by just skipping CSS transitions entirely for tests,
    // using the reduced-motion support the app already implements for
    // real accessibility reasons, not just for this workaround.
    reducedMotion: "reduce",
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
