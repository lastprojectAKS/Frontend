# SMTBS — Smart Movie Ticket Booking System

A frontend-only movie ticket booking product UI: browse movies, pick a cinema,
choose a showtime and seat, and walk through a simulated checkout — all
running on local mock data, no backend required.

## Stack

- React 19 + Vite
- Tailwind CSS v4 (design tokens defined in `src/index.css` via `@theme`)
- React Router (client-side routing)
- Framer Motion (entrance/hover/modal animation)
- lucide-react (icon set)

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to `http://localhost:5173`).

```bash
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

## Project structure

```
src/
  components/
    ui/        Button, Badge, Rating, Modal, Tabs, SectionHeader, EmptyState
    layout/    Navbar, MobileDrawer, Footer, Layout
    home/      Hero, NowShowing, ComingSoon, CinemasPreview, OffersPreview, WhyChooseUs
    movies/    MovieCard, ComingSoonCard, MovieGrid, SearchBar, FilterBar, TrailerModal
    cinemas/   CinemaCard
    offers/    OfferCard
    booking/   Seat, SeatMap, BookingSummary
  pages/       One component per route (see below)
  data/        Local mock data — movies, cinemas, offers, showtimes, seat map, bookings
  context/     BookingContext — carries the in-progress booking (movie → cinema →
               date → time → seats) across the multi-page booking flow
  lib/         Small formatting helpers (duration, currency, date)
```

## Routes

`/`, `/movies`, `/movies/:id`, `/cinemas`, `/cinemas/:id`, `/offers`,
`/booking`, `/booking/seats`, `/checkout`, `/booking/success`, `/profile`

## Notes

- All data is local mock data in `src/data/` — there is no backend, API, auth, or payment integration.
- Login, checkout, and payment are UI-only simulations; nothing is charged or stored.
- `legacy-static/` holds the original vanilla HTML/CSS/JS version of this site, kept for reference.
