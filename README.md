# SMTBS — Smart Movie Ticket Booking System

This repository's app lives in [`SMTBS_Homepage/SMTBS_Homepage/`](SMTBS_Homepage/SMTBS_Homepage/) —
see that directory's [README](SMTBS_Homepage/SMTBS_Homepage/README.md) for the
full write-up (features, stack, setup, project structure, routes).

## Quick summary

A movie ticket booking product with two apps in one codebase: a
customer-facing site (browse movies, pick a cinema, choose a showtime and
seat, walk through checkout) and a separate admin portal (catalog,
scheduling, bookings, customers, reporting).

It is backed by a real Supabase project — real accounts, sessions, and
Row-Level Security. The customer-facing catalog, showtimes, seats, and
bookings are real Postgres tables with a database-enforced double-booking
guard; the admin portal's own CRUD still runs against local mock data
pending migration (see the inner README's "What's real vs. what's mock"
section for the current, authoritative breakdown — that split changes as
the project progresses, so it's tracked in one place rather than two).

## Getting started

```bash
cd "SMTBS_Homepage/SMTBS_Homepage"
npm install
npm run dev
```

See the [inner README](SMTBS_Homepage/SMTBS_Homepage/README.md) for
Supabase project setup (required — the app throws on startup without
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` configured).
