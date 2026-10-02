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
resource (Movies, Cinemas & Screens, Showtimes, Bookings, Customers,
Dashboard & Reports) — reads and writes the real Supabase tables in
`supabase/migrations/`, behind Row-Level Security. That includes:

- A database-enforced double-booking guard (`book_seats()` + a partial unique
  index), with a matching `cancel_booking()` that releases seats for resale.
- Loyalty points actually earned per booking (1 point per dollar charged) and
  reversed on cancellation — both inside the same RPCs, atomically.
- Real favourites (`favourites` table, RLS-scoped to each customer).
- Real password reset for both customer and admin accounts (Supabase's
  `resetPasswordForEmail` / `updateUser` flow).
- Admin business rules (`src/admin/lib/businessRules.js`) — no overlapping
  showtimes, can't delete a movie/showtime with active bookings, screen
  capacity can't drop below what's already booked — all checked against the
  real tables, backed by real database constraints (an `EXCLUDE USING gist`
  constraint makes an overlapping showtime impossible to insert regardless of
  what the client checks).

What's honestly not built, rather than faked:
- Phone number sign-in is scaffolded (`AuthContext.sendPhoneOtp` /
  `verifyPhoneOtp`) but not wired into the UI — needs a paid SMS provider
  (e.g. Twilio) connected in Supabase first.
- Admin Settings' notification toggles and system preferences (rows-per-page,
  date format) are local-only — there's no notification system or per-admin
  preference concept anywhere else in the app to persist them against.
  Settings' actual account fields (profile name, password) are real.

## Stack

- React 19 + Vite
- Tailwind CSS v4 (design tokens defined in `src/index.css` via `@theme`)
- React Router (client-side routing)
- Framer Motion (entrance/hover/modal animation)
- Recharts (admin dashboard & reports charts)
- lucide-react (icon set)
- Supabase — Postgres database, Auth (email/password + Google OAuth), Row-Level Security

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
4. In Supabase → Authentication → Providers, turn off "Confirm email" (for
   frictionless local testing), and enable Google as a provider if you want
   Google sign-in working — you'll need a Google Cloud OAuth client with
   Supabase's callback URL registered as an authorized redirect URI, and your
   dev/production origins registered in Supabase's own Redirect URLs list
   (Authentication → URL Configuration) for both Google sign-in and password
   reset links to land correctly.
5. Start the dev server:
   ```bash
   npm run dev
   ```
   Then open the printed local URL (defaults to `http://localhost:5173`).

```bash
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

## Testing

Real end-to-end tests (Playwright) against a running dev server and the real
Supabase backend — no mocking. This is the same approach used to manually
verify every phase of the Supabase migration during development, now checked
into the repo as a permanent regression suite instead of one-off scripts.

```bash
npx playwright install chromium   # one-time browser download
npm run test:e2e                  # requires the dev server running (npm run dev)
npm run test:e2e:ui               # interactive UI mode, useful while debugging
```

What's covered (`e2e/`):
- **`auth.spec.js`** — customer and admin login, wrong-password rejection, a
  non-admin account correctly locked out of `/admin`.
- **`customer-booking.spec.js`** — the full real journey: browse → pick
  cinema/date/showtime → seat map → checkout → real booking → cancel. Books
  and cancels a real seat every run, so it never runs out of inventory.
- **`double-booking-guard.spec.js`** — the most important test in the suite:
  calls `book_seats()` directly (bypassing the seat picker) for the same
  seat twice, proving the database itself — not just the UI — rejects the
  second attempt via the partial unique index in
  `0007_bookings_and_seats.sql`.
- **`admin-crud.spec.js`** — smoke-tests every migrated admin resource
  (Dashboard, Movies, Cinemas & Screens, Showtimes, Bookings, Customers,
  Reports) against real data.
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
               seats, bookings (book_seats / cancel_booking), favourites
  context/     AuthContext (real Supabase session, password reset, profile
               refresh), FavouritesContext (shared favourited-movie-id set),
               BookingContext (in-progress booking state across the multi-page
               flow), ThemeContext, ToastContext
  lib/         supabaseClient.js, constants.js (BOOKING_FEE — kept in sync with
               the flat fee in book_seats()), formatting helpers (duration,
               currency, date)

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

- Checkout and payment are still UI-only simulations — nothing is charged —
  but the booking, seats, and loyalty points it creates are real.
- Customers can cancel an upcoming booking from Profile → Upcoming; admins
  can cancel or refund any booking from `/admin/bookings`. Both paths call
  `cancel_booking()`, which releases the seats (so they're bookable again),
  decrements the showtime's occupancy, and reverses the loyalty points that
  booking earned — all in the same transaction. A refund additionally flips
  `payment_status`/`booking_status` to `Refunded` after that.
- Showtimes are extended on a rolling window relative to whenever
  `0010_showtime_seed_and_cancel.sql` is run, not a fixed date — it's
  additive and idempotent (closes out past 'Scheduled' showtimes to
  'Completed', inserts fresh ones for the days ahead, never deletes), so
  it's safe to re-run periodically (e.g. via a scheduled job) to keep the
  bookable window from running dry, including against the live database
  with real bookings in it.
- `legacy-static/` holds the original vanilla HTML/CSS/JS version of this
  site, kept for reference.
