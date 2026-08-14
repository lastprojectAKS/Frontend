# 🎬 SMTBS — Smart Movie Ticket Booking System

A modern, full-featured movie ticket booking web app: browse movies, filter by
genre or status, pick a cinema and showtime, choose your seat on an
interactive seat map, and walk through a simulated checkout to a booking
confirmation — all with light and dark theme support.

This is a college group project. It is a **frontend-only** build: all movie,
cinema, showtime, and booking data is local mock data, and login/checkout are
realistic UI simulations. Nothing is charged, stored on a server, or sent
anywhere.

## Live demo

Run locally with the setup instructions below — see [Getting started](#getting-started).

## Features

- **Browse & discover** — Home page with a cinematic hero, "Now Showing" and
  "Coming Soon" rails, cinema and offer previews
- **Search & filter** — search by title/genre, filter by status (now
  showing / coming soon) and genre, with empty-state handling
- **Movie details** — cast, synopsis, rating, showtimes, and available
  cinemas per movie
- **Cinema directory** — browse cinemas with amenities (IMAX, Dolby Atmos,
  recliners, accessibility) and see what's playing at each one
- **Full booking flow** — movie → cinema → date → showtime → seat
  selection → checkout → confirmation, all backed by React state
- **Interactive seat map** — available / selected / occupied / VIP /
  wheelchair-accessible seats, with live price calculation
- **Simulated checkout** — contact info, payment method UI (card / Apple Pay
  / Google Pay), clearly marked as a demo with no real payment processing
- **Demo authentication** — sign up, log in, log out; session persists across
  reloads via `localStorage`; browsing works fully without an account
- **Light & dark mode** — both are real, independently-tuned themes (not a
  simple color invert), toggle in the navbar, respects system preference on
  first visit, persists across sessions
- **Responsive** — designed and tested from 320px phones up to 1920px
  desktops
- **Accessible** — WCAG AA color contrast verified across both themes, skip
  link, keyboard navigation, semantic headings, ARIA labeling throughout

## Tech stack

| | |
|---|---|
| Framework | [React 19](https://react.dev/) + [Vite](https://vite.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) (custom design tokens) |
| Routing | [React Router](https://reactrouter.com/) |
| Animation | [Framer Motion](https://motion.dev/) |
| Icons | [lucide-react](https://lucide.dev/) |
| State | React Context (booking flow, auth, theme, toasts) + local mock data |

No backend, database, authentication provider, or payment gateway is used.

## Project structure

```
SMTBS_Homepage/SMTBS_Homepage/     ← the app lives here
├── src/
│   ├── components/
│   │   ├── ui/        Button, Badge, Rating, Modal, Tabs, SectionHeader, EmptyState
│   │   ├── layout/     Navbar, MobileDrawer, Footer, Layout
│   │   ├── home/       Hero, NowShowing, ComingSoon, CinemasPreview, OffersPreview, WhyChooseUs
│   │   ├── movies/     MovieCard, ComingSoonCard, MovieGrid, SearchBar, FilterBar, TrailerModal
│   │   ├── cinemas/    CinemaCard
│   │   ├── offers/     OfferCard
│   │   ├── booking/    Seat, SeatMap, BookingSummary
│   │   └── auth/       AuthModal (combined login / sign up)
│   ├── pages/          One component per route (see Routes below)
│   ├── context/         BookingContext, AuthContext, ThemeContext, ToastContext
│   ├── data/            Local mock data — movies, cinemas, offers, showtimes, seat map, bookings
│   └── lib/              Formatting helpers (duration, currency, date)
├── public/images/       Movie posters (real posters + generated original poster art)
└── legacy-static/       The project's original vanilla HTML/CSS/JS version, kept for reference
```

## Routes

| Route | Page |
|---|---|
| `/` | Home |
| `/movies` | Browse & search movies |
| `/movies/:id` | Movie details |
| `/cinemas` | Cinema directory |
| `/cinemas/:id` | Cinema details |
| `/offers` | Promotions |
| `/booking` | Showtime selection |
| `/booking/seats` | Seat selection |
| `/checkout` | Checkout |
| `/booking/success` | Booking confirmation |
| `/profile` | Account (bookings, favourites, settings) |

## Getting started

```bash
cd "SMTBS_Homepage/SMTBS_Homepage"
npm install
npm run dev
```

Open the local URL Vite prints (defaults to `http://localhost:5173`).

```bash
npm run build     # production build to dist/
npm run preview   # serve the production build locally
```

## Notes for reviewers / markers

- This is intentionally a **frontend-only** deliverable — see the tech stack
  above. Login/signup, bookings, and checkout are complete UI flows backed by
  local state, not a real backend.
- The movie catalog mixes real, publicly-known films (used for their factual
  metadata) with several original fictional titles, since no licensed poster
  assets were available for those — their poster art was generated to match
  the app's visual design system rather than sourced from elsewhere.
- The original static (non-React) version of this site is preserved under
  `legacy-static/` for reference.
