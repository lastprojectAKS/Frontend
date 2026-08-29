# SMTBS — Smart Movie Ticket Booking System

A movie ticket booking product with two apps in one codebase: a customer-facing
site (browse movies, pick a cinema, choose a showtime and seat, walk through
checkout) and a completely separate admin portal (catalog, scheduling,
bookings, customers, reporting) for running the business behind it. Both are
backed by a real Supabase project — real accounts, real sessions, real
role-based access control.

## What's real vs. what's mock

- **Real**: authentication and user accounts (email/password + Google OAuth,
  for both customer and admin sign-in), the `profiles` table, and the
  Row-Level Security policies that gate who can read or write what.
- **Mock, but structured for it**: the movie/cinema/showtime/booking catalog
  currently lives in local data files, accessed through an async service
  layer (`src/admin/services/`) shaped exactly like real API calls — so it
  can be swapped for live Supabase tables without touching the UI.

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
   Google sign-in working (see setup notes below).
5. Start the dev server:
   ```bash
   npm run dev
   ```
   Then open the printed local URL (defaults to `http://localhost:5173`).

```bash
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

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
    auth/      AuthModal — email/password + Google sign-in/sign-up
    home/      Hero, NowShowing, ComingSoon, CinemasPreview, OffersPreview, WhyChooseUs
    movies/    MovieCard, ComingSoonCard, MovieGrid, SearchBar, FilterBar, TrailerModal
    cinemas/   CinemaCard
    offers/    OfferCard
    booking/   Seat, SeatMap, BookingSummary
  pages/       One component per customer-facing route (see below)
  data/        Local mock data — movies, cinemas, offers, showtimes, seat map, bookings
  context/     AuthContext (real Supabase session), BookingContext (in-progress
               booking state across the multi-page flow), ThemeContext, ToastContext
  lib/         supabaseClient.js, plus small formatting helpers (duration, currency, date)

src/admin/     Isolated admin portal — its own auth, layout, and data services
  pages/       Dashboard, Movies, Cinemas & Screens, Showtimes, Bookings,
               Customers, Reports & Analytics, Settings, Login
  components/  Admin-only UI: DataTable, StatusBadge, ConfirmDialog, forms, charts
  context/     AdminAuthContext — real Supabase session, role-gated
  data/        Mock catalog/business data (richer shape than the customer app's —
               5-stage movie lifecycle, seat categories, business rules)
  services/    Async service layer wrapping the mock data, shaped like a real API
  lib/         businessRules.js (conflict detection, delete guards, capacity
               rules), dateUtils.js (timezone-safe date math)

supabase/
  migrations/  SQL migrations, run in order against your Supabase project
```

## Routes

**Customer:** `/`, `/movies`, `/movies/:id`, `/cinemas`, `/cinemas/:id`,
`/offers`, `/booking`, `/booking/seats`, `/checkout`, `/booking/success`,
`/profile`

**Admin** (role-gated, redirects to `/admin/login` if not signed in as staff):
`/admin/dashboard`, `/admin/movies`, `/admin/movies/:id`, `/admin/cinemas`,
`/admin/showtimes`, `/admin/bookings`, `/admin/bookings/:id`,
`/admin/customers`, `/admin/customers/:id`, `/admin/reports`,
`/admin/settings`

## Notes

- Checkout and payment are still UI-only simulations — nothing is charged.
- Phone number sign-in is scaffolded (`AuthContext.sendPhoneOtp` /
  `verifyPhoneOtp`) but not enabled in the UI — it needs a paid SMS provider
  (e.g. Twilio) connected in Supabase first.
- Admin business rules (no overlapping showtimes on a screen, can't delete a
  movie/showtime with active bookings, screen capacity can't drop below what's
  already booked, etc.) are enforced in `src/admin/lib/businessRules.js`.
- `legacy-static/` holds the original vanilla HTML/CSS/JS version of this
  site, kept for reference.
