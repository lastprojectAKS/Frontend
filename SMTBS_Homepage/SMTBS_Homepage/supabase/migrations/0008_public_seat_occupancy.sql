-- Fixes a real bug found in review before it could surface in testing:
-- booking_seats only allowed a customer to see rows from their own
-- bookings, but the seat map needs to know EVERY confirmed seat for a
-- showtime to render occupancy correctly for any browsing customer. The
-- double-booking guard itself was never at risk (book_seats() runs with
-- elevated privilege and bypasses RLS), but the seat picker would have
-- shown other people's booked seats as available right up until checkout
-- rejected them.
--
-- This adds a second, permissive SELECT policy scoped to confirmed seats
-- only — RLS policies for the same action combine with OR, so this simply
-- widens who can see confirmed rows without touching the existing
-- own-bookings policy. It reveals only showtime_id/seat_label-level
-- occupancy, not who booked a seat (customer identity stays in `bookings`,
-- which keeps its own stricter policy).
create policy "booking_seats_public_occupancy_read" on public.booking_seats
  for select
  using (status = 'confirmed');
