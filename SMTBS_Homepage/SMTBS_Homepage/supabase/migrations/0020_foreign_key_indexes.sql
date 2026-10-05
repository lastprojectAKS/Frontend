-- Postgres doesn't index foreign key columns automatically. Without these,
-- deleting or updating a parent row scans the child table, and the
-- per-customer and per-showtime lookups the app runs all the time (booking
-- history, admin customer stats, seat availability) scan whole tables.

create index if not exists idx_booking_seats_booking_id on public.booking_seats (booking_id);
create index if not exists idx_bookings_cinema_id on public.bookings (cinema_id);
create index if not exists idx_bookings_customer_id on public.bookings (customer_id);
create index if not exists idx_bookings_movie_id on public.bookings (movie_id);
create index if not exists idx_bookings_screen_id on public.bookings (screen_id);
create index if not exists idx_bookings_showtime_id on public.bookings (showtime_id);
create index if not exists idx_favourites_movie_id on public.favourites (movie_id);
create index if not exists idx_screens_cinema_id on public.screens (cinema_id);
create index if not exists idx_showtimes_cinema_id on public.showtimes (cinema_id);
create index if not exists idx_showtimes_movie_id on public.showtimes (movie_id);
