-- The public occupancy read only exposed confirmed seats, so when a booking was
-- cancelled the release never reached other customers' open seat maps. Released
-- rows are shown too: they carry only the seat label, status and showtime, which
-- anyone can already infer from the seat map.

drop policy if exists "booking_seats_public_occupancy_read" on public.booking_seats;

create policy "booking_seats_public_occupancy_read" on public.booking_seats
  for select
  using (status in ('confirmed', 'released'));
