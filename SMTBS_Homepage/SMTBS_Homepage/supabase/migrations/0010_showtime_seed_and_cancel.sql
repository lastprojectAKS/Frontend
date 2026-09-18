-- Fixes two real bugs found in review, plus completes the double-booking
-- guard's other half (releasing seats on cancellation).
--
-- This project is live at smtbs.vercel.app, so — unlike a from-scratch dev
-- seed — this migration is written to be non-destructive: it never deletes
-- from bookings/booking_seats/showtimes, only corrects/extends them. Safe
-- to run against a database with real customer bookings in it, and safe to
-- re-run (every step is idempotent).
--
-- Bug 1: the 0006 seed pinned "today" to a hardcoded '2026-08-21' and
-- generated a fixed 14-day window around it, with nothing to ever flip a
-- showtime to 'Completed' once its date passed. Once real time moves past
-- that window, every seeded showtime is still 'Scheduled' — so the booking
-- flow would offer, and let you pay for, a screening that already
-- happened. The client also had no floor filter on show_date (now fixed in
-- src/services/showtimeService.js). Here: (a) close out any 'Scheduled'
-- showtime whose date has already passed, and (b) extend real coverage
-- forward with a fresh rolling window, in the same shape the original seed
-- used, inserted only where it doesn't already exist.
update public.showtimes
set status = 'Completed'
where status = 'Scheduled' and show_date < current_date;

with date_range as (
  select generate_series(current_date - 3, current_date + 10, interval '1 day')::date as show_date
),
slots as (
  select * from (values (0, '10:00'::time), (1, '13:30'::time), (2, '17:00'::time), (3, '20:30'::time)) as s(slot_index, start_time)
),
active_screens as (
  select
    s.id as screen_id, s.cinema_id, s.type,
    (select coalesce(sum(c.seat_count), 0) from public.screen_seat_categories c where c.screen_id = s.id) as capacity
  from public.screens s
  where s.status = 'Active'
),
now_showing as (
  select id, duration, (row_number() over (order by id) - 1) as movie_index
  from public.movies
  where status = 'Now Showing'
),
now_showing_count as (
  select count(*) as cnt from now_showing
),
combos as (
  select
    scr.screen_id, scr.cinema_id, scr.type, scr.capacity,
    d.show_date, sl.slot_index, sl.start_time,
    hashtext(scr.screen_id || d.show_date::text || sl.slot_index::text) as h
  from active_screens scr
  cross join date_range d
  cross join slots sl
  -- Only fill in slots that don't already have a real (non-cancelled)
  -- showtime — this is what makes the insert additive-only and safe to
  -- re-run, instead of a blind delete+reseed.
  where not exists (
    select 1 from public.showtimes existing
    where existing.screen_id = scr.screen_id
      and existing.show_date = d.show_date
      and existing.start_time = sl.start_time
      and existing.status <> 'Cancelled'
  )
),
assigned as (
  select
    c.*,
    nsm.id as movie_id,
    (c.start_time + ((nsm.duration + 20) * interval '1 minute'))::time as end_time
  from combos c
  cross join now_showing_count nc
  join now_showing nsm on nsm.movie_index = mod(abs(c.h) + c.slot_index, nc.cnt)
  where nc.cnt > 0
)
insert into public.showtimes (movie_id, cinema_id, screen_id, show_date, start_time, end_time, price, total_seats, booked_seats, status)
select
  a.movie_id, a.cinema_id, a.screen_id, a.show_date, a.start_time, a.end_time,
  case a.type when 'IMAX' then 19 when 'Premium' then 16 else 12 end,
  a.capacity,
  0,
  -- The window intentionally reaches 3 days into the past (matching the
  -- original seed's shape), and a slot there can reach this insert if its
  -- old row was 'Cancelled' (the NOT EXISTS guard above only excludes
  -- non-cancelled rows). Without this branch that could insert a *new*
  -- 'Scheduled' row dated in the past — exactly the bug this migration
  -- fixes. Backdated slots always land as 'Completed', never bookable.
  case
    when a.show_date < current_date then 'Completed'
    when mod(abs(a.h), 10) = 9 then 'Cancelled'
    else 'Scheduled'
  end
from assigned a;

-- Bug 2: the 0006 seed also set `booked_seats` to a random 15-85% of
-- capacity for realistic-looking "few seats left" badges, but created zero
-- matching `booking_seats` rows — so the seat map (which reads
-- booking_seats) showed every seat free while the availability badge
-- (which reads booked_seats) said otherwise. This recomputes booked_seats
-- from the real, authoritative source — confirmed booking_seats rows —
-- for every showtime, which is correct whether or not real bookings exist
-- and safe to re-run (book_seats()/cancel_booking() keep it in sync from
-- here on; this just corrects the pre-existing drift once).
update public.showtimes st
set booked_seats = coalesce(counted.seat_count, 0)
from (
  select
    s.id as showtime_id,
    (select count(*) from public.booking_seats bs where bs.showtime_id = s.id and bs.status = 'confirmed') as seat_count
  from public.showtimes s
) counted
where counted.showtime_id = st.id
  and st.booked_seats is distinct from coalesce(counted.seat_count, 0);

-- Bug 3: booking_seats has a 'released' status and the double-booking
-- index already drops released seats out of contention, but nothing ever
-- set a seat to 'released' — there was no RLS policy letting a customer
-- (or admin) update booking_seats at all, and no function that did it on
-- their behalf. A cancelled booking permanently burned its seats.
--
-- cancel_booking() closes that loop: it's the customer-facing analogue of
-- book_seats(), releasing every confirmed seat on a booking, flipping the
-- booking to Cancelled, and decrementing showtimes.booked_seats — all in
-- one transaction, callable by the booking's owner or an admin.
create or replace function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
as $$
declare
  v_booking     public.bookings%rowtype;
  v_customer_id uuid := auth.uid();
  v_released    integer;
begin
  if v_customer_id is null then
    raise exception 'Sign in to manage bookings.';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking not found.';
  end if;
  if v_booking.customer_id <> v_customer_id and not public.is_admin() then
    raise exception 'You can only cancel your own bookings.';
  end if;
  if v_booking.booking_status <> 'Confirmed' then
    raise exception 'This booking is already %.', lower(v_booking.booking_status);
  end if;

  update public.booking_seats
  set status = 'released'
  where booking_id = p_booking_id and status = 'confirmed';
  get diagnostics v_released = row_count;

  update public.showtimes
  set booked_seats = greatest(0, booked_seats - v_released)
  where id = v_booking.showtime_id;

  update public.bookings
  set booking_status = 'Cancelled'
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

grant execute on function public.cancel_booking(uuid) to authenticated;
