-- Broadcast seat changes so every open seat map updates the moment a seat is
-- booked or released, instead of only on page load. Seat occupancy is already
-- readable by everyone (0008_public_seat_occupancy), so realtime delivers the
-- same rows a fresh page load would see.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'booking_seats'
  ) then
    alter publication supabase_realtime add table public.booking_seats;
  end if;
end $$;
