-- Re-running 0010 to extend the showtime window forward (routine
-- maintenance — see its own comments) failed with:
--   ERROR: 22000: range lower bound must be less than or equal to range
--   upper bound
-- Root cause: end_time was computed as
--   (start_time + (duration + 20 minutes))::time
-- and Postgres's `time` type wraps at 24h on cast, instead of overflowing.
-- "CIHE" (a real movie added to the catalog after 0010 was written) is 190
-- minutes — on the last daily slot (20:30), 20:30 + 3h30m wraps to 00:00,
-- which is *before* 20:30 on the same show_date. showtimes' own overlap
-- constraint (0006's `exclude using gist`, built from
-- tsrange(show_date+start_time, show_date+end_time)) then rejects the
-- insert outright, since a range with lower > upper is invalid — this is
-- the same midnight-rollover limitation noted (but left unfixed, as
-- out-of-scope at the time) during the Phase 5.3 admin Showtimes work.
--
-- Fix: do the end-time arithmetic in plain integer minutes-since-midnight
-- instead of `time` arithmetic, and clamp to 23:59 instead of wrapping if a
-- slot would run past midnight. A showtime's displayed end time becomes
-- slightly inaccurate in that specific edge case (loses a few minutes off
-- the real runtime) rather than corrupting the row entirely — a reasonable
-- trade for a cosmetic scheduling field that doesn't block a real fix.
--
-- Otherwise identical to 0010: still non-destructive, still idempotent,
-- still safe to run against the live database with real bookings in it.

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
    -- Plain integer minutes-since-midnight, never cast through `time`
    -- until after clamping — this is what avoids the wraparound.
    least(
      (extract(hour from c.start_time)::int * 60 + extract(minute from c.start_time)::int) + nsm.duration + 20,
      23 * 60 + 59
    ) as end_minutes
  from combos c
  cross join now_showing_count nc
  join now_showing nsm on nsm.movie_index = mod(abs(c.h) + c.slot_index, nc.cnt)
  where nc.cnt > 0
)
insert into public.showtimes (movie_id, cinema_id, screen_id, show_date, start_time, end_time, price, total_seats, booked_seats, status)
select
  a.movie_id, a.cinema_id, a.screen_id, a.show_date, a.start_time,
  make_time(a.end_minutes / 60, a.end_minutes % 60, 0),
  case a.type when 'IMAX' then 19 when 'Premium' then 16 else 12 end,
  a.capacity,
  0,
  case
    when a.show_date < current_date then 'Completed'
    when mod(abs(a.h), 10) = 9 then 'Cancelled'
    else 'Scheduled'
  end
from assigned a;

-- Same as 0010 — recomputes booked_seats from the real, authoritative
-- source (confirmed booking_seats rows), safe to re-run.
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
