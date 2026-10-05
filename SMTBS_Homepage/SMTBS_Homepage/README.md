# SMTBS — Smart Movie Ticket Booking System

A movie ticket booking product with two apps in one codebase: a customer-facing
site (browse movies, pick a cinema, choose a showtime and seat, walk through
checkout) and a completely separate admin portal (catalog, scheduling,
bookings, customers, reporting) for running the business behind it. Both run
on one real Supabase project — real accounts, real sessions, real role-based
access control — and both read and write the same tables, so an admin change
(adding a movie, scheduling a showtime, cancelling a booking) is immediately
what customers see, not a separate mock world.

Live at **[smtbs.vercel.app](https://smtbs.vercel.app)**.

## What's real vs. what's not

Everything either app does — customer browsing/booking and every admin
resource (Movies, Cinemas & Screens, Showtimes, Offers, Bookings, Customers,
Dashboard & Reports) — reads and writes the real Supabase tables in
`supabase/migrations/`, behind Row-Level Security. That includes:

- A database-enforced double-booking guard (`book_seats()` + a partial unique
  index), with a matching `cancel_booking()` that releases seats for resale.
- Loyalty points actually earned per booking (1 point per dollar charged) and
  reversed on cancellation — both inside the same RPCs, atomically. Also
  actually redeemable: an "Apply my points" toggle at checkout (100 points =
  $1 AUD) discounts the real Stripe charge, server-computed and
  server-clamped the same way the price itself is — `quote_booking()` caps
  how many points a given order can absorb (never down to a $0 charge,
  Stripe can't process one), `book_seats()` re-derives and re-clamps the
  redeemed amount rather than trusting what the client asked for, and
  `cancel_booking()` restores redeemed points alongside reversing earned
  ones.
- Real favourites (`favourites` table, RLS-scoped to each customer).
- Real password reset for both customer and admin accounts (Supabase's
  `resetPasswordForEmail` / `updateUser` flow).
- Admin business rules (`src/admin/lib/businessRules.js`) — no overlapping
  showtimes, can't delete a movie/showtime with active bookings, screen
  capacity can't drop below what's already booked — all checked against the
  real tables, backed by real database constraints (an `EXCLUDE USING gist`
  constraint makes an overlapping showtime impossible to insert regardless of
  what the client checks).
- Real Stripe payments (test mode) — Checkout uses Stripe's `PaymentElement`,
  so the client never touches raw card numbers. A Supabase Edge Function
  computes the authoritative price server-side and creates the
  PaymentIntent; after the card is charged, a second Edge Function
  re-verifies the charge directly with Stripe (never trusting the client's
  own "it succeeded" claim) before calling `book_seats()`. See "Payments"
  below for setup and test card numbers.
- Real Stripe refunds — an admin's "Refund" action calls a third Edge
  Function (`refund-booking`) that re-checks admin status server-side, then
  calls Stripe's refund API, and only flips the booking to `Refunded` once
  Stripe confirms the charge was actually reversed. (Bookings that predate
  Stripe have no `payment_intent_id`, so they just get the plain status
  flip, same as before.)
- Real image uploads — the admin Movie form's Poster/Backdrop fields have an
  "Upload image" option alongside the plain URL field, backed by a public
  Supabase Storage bucket (`movie-images`, `supabase/migrations/0015`) with
  admin-only write access (same `is_admin()` check every other admin write
  uses) and a 5MB/image-only limit enforced by the bucket itself.
- Bulk movie import — "Import CSV" on the Movies page uploads a CSV
  (template: `public/templates/movies-import-template.csv`) and creates a
  real movie per row via the same `createMovie()` every other admin write
  goes through. Best-effort: each row is validated and imported
  independently, so one bad row (missing field, duplicate title) is skipped
  and reported rather than blocking the rest of the file.
- Real admin CRUD for Offers — the same create/edit/delete pattern as Movies,
  backed by the real `offers` table, hitting the public Offers page live.
- Promo codes apply at checkout. Each offer has a structured percent or
  fixed-amount discount, optional valid weekdays and date range, and an
  active flag. `resolve_offer()` in the database is the single check for
  whether a code is valid for a showtime, used by both the price quote and
  the final booking. The offer discount applies to the seat subtotal before
  the booking fee, and loyalty points can be used on top of it.

What's honestly not built, rather than faked:
- Offers that are not a percent or fixed amount off (e.g. a flat $8 ticket
  price) can't be expressed, so the seeded TUESDAY8 offer is inactive.
  COUPLES15's recliner-only restriction is not enforced; it discounts the
  whole order.
- Admins can see a customer's loyalty balance on the Customers list and detail
  page, but can't adjust it from the UI.
- Phone number sign-in is scaffolded (`AuthContext.sendPhoneOtp` /
  `verifyPhoneOtp`) but not wired into the UI — needs a paid SMS provider
  (e.g. Twilio) connected in Supabase first.
- Admin Settings' notification toggles and system preferences (rows-per-page,
  date format) are local-only — there's no notification system or per-admin
  preference concept anywhere else in the app to persist them against.
  Settings' actual account fields (profile name, password) are real.
- Payment confirmation has a Stripe webhook as a safety net: if the browser
  never returns after a successful charge, the `stripe-webhook` Edge Function
  creates the booking from the PaymentIntent's own metadata, and refunds the
  charge if the seats can no longer be booked. The normal path is still
  `confirm-booking`, which re-verifies the charge with Stripe first.
- Seat bookings are created only by the server, after Stripe confirms a
  payment (`confirm-booking` and `stripe-webhook` call
  `book_seats_for_customer()` with the service role). Signed-in customers
  can't call the booking function directly (`supabase/migrations/0029`).

## Stack

- React 19 + Vite
- Tailwind CSS v4 (design tokens defined in `src/index.css` via `@theme`)
- React Router (client-side routing)
- Framer Motion (entrance/hover/modal animation)
- Recharts (admin dashboard & reports charts)
- lucide-react (icon set)
- Supabase — Postgres database, Auth (email/password, Google OAuth for customers, authenticator-app codes for admins), Row-Level Security
- Cloudflare Turnstile — bot protection on sign-in, sign-up and password reset
- Stripe — payments (test mode), refunds and a webhook safety net

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Supabase project at [supabase.com](https://supabase.com), then copy
   `.env.example` to `.env` and fill in your project's URL and anon key
   (Project Settings → API):
   ```bash
   cp .env.example .env
   ```
3. Run the SQL migrations in `supabase/migrations/` (in order) via the
   Supabase SQL Editor — they set up the `profiles` table, the trigger that
   creates a profile on signup, and the RLS policies.
4. Turn on the protections in Supabase: Authentication → Multi-Factor (TOTP
   enabled, for admin codes), and Authentication → Attack Protection (CAPTCHA
   on, Cloudflare Turnstile selected, with your Turnstile secret key). Set
   `VITE_TURNSTILE_SITE_KEY` in `.env` (and in your hosting provider's
   environment variables) to the Turnstile site key. Without it, the sign-in
   check doesn't appear and the local site still works.
5. In Supabase → Authentication → Providers, turn off "Confirm email" (for
   frictionless local testing), and enable Google as a provider if you want
   Google sign-in working — you'll need a Google Cloud OAuth client with
   Supabase's callback URL registered as an authorized redirect URI, and your
   dev/production origins registered in Supabase's own Redirect URLs list
   (Authentication → URL Configuration) for both Google sign-in and password
   reset links to land correctly.
6. Start the dev server:
   ```bash
   npm run dev
   ```
   Then open the printed local URL (defaults to `http://localhost:5173`).

```bash
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

## Payments

Real Stripe integration, test mode only — no live charges are possible with
test-mode keys.

1. Create a free Stripe account at [stripe.com](https://stripe.com). Stay in
   **Test mode** (toggle in the Stripe Dashboard) — no business verification
   is needed to get test-mode keys.
2. Developers → API keys. Copy the **Publishable key** (`pk_test_...`) into
   `.env` as `VITE_STRIPE_PUBLISHABLE_KEY`. Copy the **Secret key**
   (`sk_test_...`) too, but don't put it in `.env` or any other
   `VITE_`-prefixed variable — Vite bundles those into client-side JS that
   anyone can read.
3. Run `supabase/migrations/0014_stripe_payment_intents.sql` via the
   Supabase SQL Editor, same as every other migration in this project.
4. Deploy the Edge Functions (`supabase/functions/create-payment-intent`,
   `confirm-booking`, `refund-booking`, `cancel-booking`, `cancel-showtime`,
   and `stripe-webhook`) via the Supabase CLI (`supabase login`,
   `supabase link --project-ref <ref>`, then `supabase functions deploy
   <name>` for each). Deploy `stripe-webhook` with `--no-verify-jwt`, since
   Stripe signs its requests instead of sending a Supabase login token.
5. Set the `STRIPE_SECRET_KEY` secret on the Supabase project to your
   `sk_test_...` value (Supabase Dashboard → Edge Functions → Secrets). Then,
   in Stripe Dashboard → Developers → Webhooks, add an endpoint at
   `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`,
   listening for `payment_intent.succeeded`, and set its signing secret as
   `STRIPE_WEBHOOK_SECRET` the same way.
6. Test with Stripe's standard test cards — any future expiry date, any
   3-digit CVC, any postcode:
   - `4242 4242 4242 4242` — succeeds immediately, no challenge.
   - `4000 0025 0000 3155` — triggers a 3D Secure authentication challenge.
   - `4000 0000 0000 0002` — a hard decline.

   Full list: [Stripe's testing docs](https://stripe.com/docs/testing).

## Security

In place:
- Row-Level Security on every table. Admin actions are checked on the server
  (`is_admin()`), not only in the browser.
- Anonymous visitors can't run booking, pricing or trigger functions
  (`supabase/migrations/0026`).
- Sign-in, sign-up, password reset and the admin login are protected by
  Cloudflare Turnstile, which Supabase checks on every request.
- Admins sign in with a 6-digit code from an authenticator app after their
  password. The code is asked for on every sign-in, including after a page
  refresh.
- Payment attempts are limited to 10 per customer per minute
  (`consume_rate_limit()`, `supabase/migrations/0028`).
- Secret keys (Stripe, the Supabase service role, and Turnstile) are only
  used on the server. Nothing secret is bundled into the browser code.
- Responses include HSTS, frame denial, no MIME sniffing, a strict referrer
  policy and restricted browser permissions (`vercel.json`).
- The dependency audit reported no known vulnerabilities at the last check.

Not yet in place:
- No backups on the Free Supabase plan.
- No error monitoring (Sentry).
- Leaked-password checking is off.
- No content security policy header yet.
- The admin code isn't required for sensitive actions such as refunds and
  showtime cancellation. It's only required to sign in.
- Google sign-in for admins is hidden, because it fails at the authenticator
  setup step. Admins use email and password.

## Testing

Real end-to-end tests (Playwright) against a running dev server and the real
Supabase backend — no mocking. This is the same approach used to manually
verify every phase of the Supabase migration during development, now checked
into the repo as a permanent regression suite instead of one-off scripts.

**Current status:** the tests need two changes before a full run passes.
Sign-in tests are blocked while Turnstile is enforced on the project, so
either disable it for test runs or use a separate test project. Admin tests
also need to enter the authenticator code, which they don't do yet.

```bash
npx playwright install chromium   # one-time browser download
npm run test:e2e                  # requires the dev server running (npm run dev)
npm run test:e2e:ui               # interactive UI mode, useful while debugging
```

**CI**: the full suite also runs automatically in GitHub Actions
(`.github/workflows/e2e.yml`) on every push and pull request to `main` —
same real backend, same real Stripe test-mode charges, no mocking there
either. Runs are serialized (`concurrency: e2e-suite`), not parallelized,
for the same reason the suite itself uses `workers: 1`: every spec shares
one fixed test account and a finite seat inventory, and two runs racing
each other would fail the same way parallel workers would locally. Needs
three repository secrets set (Settings → Secrets and variables → Actions):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`
— the same three values from `.env`.

What's covered (`e2e/`):
- **`auth.spec.js`** — customer and admin login, wrong-password rejection, a
  non-admin account correctly locked out of `/admin`.
- **`customer-booking.spec.js`** — the full real journey: browse → pick
  cinema/date/showtime → seat map → checkout → a real Stripe test-mode
  payment → real booking → cancel. Books and cancels a real seat every run,
  so it never runs out of inventory. Requires Stripe test-mode credentials
  configured (see "Payments" above) to pass at all.
- **`double-booking-guard.spec.js`** — the most important test in the suite:
  calls `book_seats()` directly (bypassing the seat picker) for the same
  seat twice, proving the database itself — not just the UI — rejects the
  second attempt via the partial unique index in
  `0007_bookings_and_seats.sql`.
- **`admin-crud.spec.js`** — smoke-tests every migrated admin resource
  (Dashboard, Movies, Cinemas & Screens, Showtimes, Bookings, Customers,
  Reports) against real data.
- **`admin-refund.spec.js`** — books and pays for a real seat, then refunds
  it from the admin panel, asserting the UI only ever reaches "Refunded" if
  the `refund-booking` Edge Function's real Stripe refund call succeeded
  (a Stripe failure there returns an inline error instead). Requires Stripe
  test-mode credentials configured to pass at all.
- **`loyalty-redemption.spec.js`** — books and pays for a real seat to
  guarantee a nonzero points balance, books a second seat redeeming those
  points, and asserts against the database (not just the UI) that the
  Stripe charge was genuinely discounted and the points balance moved by
  exactly the right amount — then cancels both and confirms the balance
  lands back exactly where it started. Requires Stripe test-mode
  credentials configured to pass at all.
- **`accessibility.spec.js`** — automated WCAG 2 A/AA checks (axe-core)
  across representative pages in both themes. This is what actually found
  every color-contrast fix in `src/index.css` — several brand/semantic
  colors cleared 4.5:1 against a plain background but fell short against
  their own 15%-opacity badge-pill backgrounds, the real worst case.

Two things worth knowing before extending this suite:
- **Runs sequentially on purpose** (`workers: 1` in `playwright.config.js`).
  Every spec shares one fixed test account (`tester@smtbs-test.com`) and a
  finite seat inventory — running specs in parallel makes them race each
  other (confirmed while building this: two specs timed out when run
  concurrently, passed immediately once serialized).
- **Uses a pre-confirmed account, not fresh signups.** Supabase's shared
  email-sending has a real rate limit that repeated signup-based tests would
  exhaust. `tester@smtbs-test.com` was created once via Supabase dashboard →
  Authentication → Users → Add User → "Auto Confirm User" (no email sent),
  then promoted to `super_admin` in the `profiles` table — it's used for
  both the customer and admin test paths.

### Creating an admin account

Every sign-up is a `customer` by default — nobody can grant themselves admin
access through the UI. To promote an account:

1. Sign up normally through the site with the email you want to use as admin.
2. In Supabase Table Editor, open the `profiles` table, find that row, and set
   its `role` column to `super_admin` (or `cinema_manager` /
   `booking_manager` for narrower access).
3. Sign in at `/admin/login` (also linked from the site footer) with that
   same account.
4. On the first admin sign-in, scan the QR code with an authenticator app
   (Google Authenticator, Microsoft Authenticator or similar) and enter the
   6-digit code it shows. Every later sign-in asks for the current code from
   that app.

## Project structure

```
src/
  components/
    ui/        Button, Badge, Rating, Modal, Tabs, SectionHeader, EmptyState
    layout/    Navbar, MobileDrawer, Footer, Layout
    auth/      AuthModal — email/password, Google sign-in/sign-up, forgot password
    home/      Hero, NowShowing, ComingSoon, CinemasPreview, OffersPreview, WhyChooseUs
    movies/    MovieCard (favourite toggle), ComingSoonCard, MovieGrid, SearchBar,
               FilterBar, TrailerModal
    cinemas/   CinemaCard
    offers/    OfferCard
    booking/   Seat, SeatMap, BookingSummary
  pages/       One component per customer-facing route (see below)
  services/    Real Supabase queries/RPCs — movies, cinemas, offers, showtimes,
               seats, bookings (book_seats / cancel_booking), favourites,
               paymentService.js (create-payment-intent / confirm-booking
               Edge Function calls)
  context/     AuthContext (real Supabase session, password reset, profile
               refresh), FavouritesContext (shared favourited-movie-id set),
               BookingContext (in-progress booking state across the multi-page
               flow), ThemeContext, ToastContext
  lib/         supabaseClient.js, stripeClient.js, constants.js (BOOKING_FEE —
               kept in sync with the flat fee in book_seats()), formatting
               helpers (duration, currency, date)

src/admin/     Isolated admin portal — its own auth, layout, and real data services
  pages/       Dashboard, Movies, Cinemas & Screens, Showtimes, Bookings,
               Customers, Reports & Analytics, Settings, Login, Reset Password
  components/  Admin-only UI: DataTable, StatusBadge, ConfirmDialog, forms, charts
  context/     AdminAuthContext — real Supabase session, role-gated, password reset
  data/        Legacy mock catalog — no longer used by any migrated resource;
               kept only for reference during the Supabase migration
  services/    Real Supabase queries/RPCs for every admin resource, shaped so the
               pages never needed to change when each resource migrated off `data/`
  lib/         businessRules.js (conflict detection, delete guards, capacity
               rules — checked against real tables), dateUtils.js (timezone-safe
               date math)

supabase/
  migrations/  SQL migrations, run in order against your Supabase project
  functions/   Edge Functions (Deno) — create-payment-intent and
               confirm-booking, the server-side half of the Stripe flow

e2e/           Playwright end-to-end tests against the real backend (see Testing)
```

## Routes

**Customer:** `/`, `/movies`, `/movies/:id`, `/cinemas`, `/cinemas/:id`,
`/offers`, `/booking`, `/booking/seats`, `/checkout`, `/booking/success`,
`/profile`, `/reset-password`

**Admin** (role-gated, redirects to `/admin/login` if not signed in as staff):
`/admin/dashboard`, `/admin/movies`, `/admin/movies/:id`, `/admin/cinemas`,
`/admin/showtimes`, `/admin/bookings`, `/admin/bookings/:id`,
`/admin/customers`, `/admin/customers/:id`, `/admin/reports`,
`/admin/settings`, `/admin/login`, `/admin/reset-password`

## Notes

- Payments are real Stripe charges in test mode, so no real money moves. The
  booking, seats and loyalty points they create are real database records.
- Customers can cancel an upcoming booking from Profile up to 2 hours before
  the showing. Cancelling a paid booking refunds the full amount through
  Stripe automatically. Admins can cancel any booking, and can refund it from
  `/admin/bookings`. Cancelling a whole showtime cancels and refunds every
  confirmed booking on it. Cancellations release the seats, reverse the
  loyalty points the booking earned, and restore any points it used, all in
  one database transaction.
- Showtimes are extended on a rolling window relative to whenever
  `0010_showtime_seed_and_cancel.sql` is run, not a fixed date — it's
  additive and idempotent (closes out past 'Scheduled' showtimes to
  'Completed', inserts fresh ones for the days ahead, never deletes), so
  it's safe to re-run periodically (e.g. via a scheduled job) to keep the
  bookable window from running dry, including against the live database
  with real bookings in it.
