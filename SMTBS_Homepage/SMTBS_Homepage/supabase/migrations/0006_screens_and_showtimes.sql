-- Phase 2b: screens and showtimes become real tables. Booking.jsx will pick
-- a real cinema/date/time from these instead of a client-side hash
-- generator. Seat-level booking and a real double-booking guard are Phase 3
-- — booked_seats here is still a denormalized occupancy counter, seeded for
-- realistic display, not yet updated by a real booking write path.
--
-- Screen IDs are kept as the same slugs already used in the admin mock data
-- (e.g. 'downtown-1') rather than generated UUIDs, so Phase 5 (migrating
-- admin's own CRUD onto these tables) can reuse them directly.

create table public.screens (
  id          text primary key,
  cinema_id   text not null references public.cinemas(id) on delete cascade,
  name        text not null,
  type        text not null check (type in ('Standard', 'Premium', 'IMAX')),
  status      text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at  timestamptz not null default now()
);

create table public.screen_seat_categories (
  id                uuid primary key default gen_random_uuid(),
  screen_id         text not null references public.screens(id) on delete cascade,
  category          text not null check (category in ('Standard', 'Premium', 'VIP')),
  seat_count        integer not null check (seat_count > 0),
  price_multiplier  numeric(4, 2) not null default 1.0,
  unique (screen_id, category)
);

create extension if not exists btree_gist;

create table public.showtimes (
  id            uuid primary key default gen_random_uuid(),
  movie_id      text not null references public.movies(id),
  cinema_id     text not null references public.cinemas(id),
  screen_id     text not null references public.screens(id),
  show_date     date not null,
  start_time    time not null,
  end_time      time not null,
  price         numeric(6, 2) not null,
  total_seats   integer not null,
  booked_seats  integer not null default 0,
  status        text not null default 'Scheduled' check (status in ('Scheduled', 'Completed', 'Cancelled')),
  created_at    timestamptz not null default now(),
  -- The real version of "no overlapping showtimes on the same screen":
  -- Postgres itself rejects the insert, not just a client-side check.
  exclude using gist (
    screen_id with =,
    show_date with =,
    tsrange((show_date + start_time)::timestamp, (show_date + end_time)::timestamp, '[)') with &&
  ) where (status <> 'Cancelled')
);

alter table public.screens enable row level security;
alter table public.screen_seat_categories enable row level security;
alter table public.showtimes enable row level security;

create policy "screens_public_read" on public.screens for select using (true);
create policy "screens_admin_insert" on public.screens for insert with check (public.is_admin());
create policy "screens_admin_update" on public.screens for update using (public.is_admin()) with check (public.is_admin());
create policy "screens_admin_delete" on public.screens for delete using (public.is_admin());

create policy "seat_categories_public_read" on public.screen_seat_categories for select using (true);
create policy "seat_categories_admin_insert" on public.screen_seat_categories for insert with check (public.is_admin());
create policy "seat_categories_admin_update" on public.screen_seat_categories for update using (public.is_admin()) with check (public.is_admin());
create policy "seat_categories_admin_delete" on public.screen_seat_categories for delete using (public.is_admin());

create policy "showtimes_public_read" on public.showtimes for select using (true);
create policy "showtimes_admin_insert" on public.showtimes for insert with check (public.is_admin());
create policy "showtimes_admin_update" on public.showtimes for update using (public.is_admin()) with check (public.is_admin());
create policy "showtimes_admin_delete" on public.showtimes for delete using (public.is_admin());

-- Seed: 9 screens across the 4 cinemas (matching the admin mock catalogue).
insert into public.screens (id, cinema_id, name, type, status) values
('downtown-1', 'downtown', 'Screen 1', 'IMAX', 'Active'),
('downtown-2', 'downtown', 'Screen 2', 'Standard', 'Active'),
('downtown-3', 'downtown', 'Screen 3', 'Premium', 'Active'),
('riverside-1', 'riverside', 'Screen 1', 'Standard', 'Active'),
('riverside-2', 'riverside', 'Screen 2', 'Premium', 'Active'),
('grand-mall-1', 'grand-mall', 'Screen 1', 'IMAX', 'Active'),
('grand-mall-2', 'grand-mall', 'Screen 2', 'Standard', 'Active'),
('uptown-plaza-1', 'uptown-plaza', 'Screen 1', 'Standard', 'Inactive'),
('uptown-plaza-2', 'uptown-plaza', 'Screen 2', 'Premium', 'Inactive');

insert into public.screen_seat_categories (screen_id, category, seat_count, price_multiplier) values
('downtown-1', 'Standard', 120, 1.0), ('downtown-1', 'Premium', 40, 1.4), ('downtown-1', 'VIP', 20, 1.9),
('downtown-2', 'Standard', 100, 1.0), ('downtown-2', 'Premium', 20, 1.4),
('downtown-3', 'Standard', 50, 1.0), ('downtown-3', 'Premium', 30, 1.4), ('downtown-3', 'VIP', 10, 1.9),
('riverside-1', 'Standard', 90, 1.0), ('riverside-1', 'Premium', 20, 1.4),
('riverside-2', 'Standard', 55, 1.0), ('riverside-2', 'Premium', 20, 1.4), ('riverside-2', 'VIP', 10, 1.9),
('grand-mall-1', 'Standard', 140, 1.0), ('grand-mall-1', 'Premium', 40, 1.4), ('grand-mall-1', 'VIP', 20, 1.9),
('grand-mall-2', 'Standard', 110, 1.0), ('grand-mall-2', 'Premium', 20, 1.4),
('uptown-plaza-1', 'Standard', 75, 1.0), ('uptown-plaza-1', 'Premium', 20, 1.4),
('uptown-plaza-2', 'Standard', 45, 1.0), ('uptown-plaza-2', 'Premium', 20, 1.4), ('uptown-plaza-2', 'VIP', 5, 1.9);

-- Seed showtimes: every active screen gets 4 showings a day (10:00, 13:30,
-- 17:00, 20:30 — spaced 3.5h apart, which safely exceeds even the longest
-- movie's runtime + buffer, so no combination of movie/slot can ever
-- overlap) across a 14-day window. Movie assignment and occupancy are
-- deterministic (hashtext-based, not random) so re-running this seed
-- produces the same data. 'today' is 2026-08-21 to match the fixed date
-- already assumed throughout the admin app's business rules.
with base as (
  select '2026-08-21'::date as today
),
date_range as (
  select generate_series(('2026-08-21'::date - 3), ('2026-08-21'::date + 10), interval '1 day')::date as show_date
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
),
assigned as (
  select
    c.*,
    nsm.id as movie_id,
    (c.start_time + ((nsm.duration + 20) * interval '1 minute'))::time as end_time
  from combos c
  cross join now_showing_count nc
  join now_showing nsm on nsm.movie_index = mod(abs(c.h) + c.slot_index, nc.cnt)
)
insert into public.showtimes (movie_id, cinema_id, screen_id, show_date, start_time, end_time, price, total_seats, booked_seats, status)
select
  a.movie_id, a.cinema_id, a.screen_id, a.show_date, a.start_time, a.end_time,
  case a.type when 'IMAX' then 19 when 'Premium' then 16 else 12 end,
  a.capacity,
  case
    when a.show_date < (select today from base) then round(a.capacity * (0.3 + mod(abs(a.h), 50)::numeric / 100))::int
    when mod(abs(a.h), 10) = 9 then 0
    else round(a.capacity * (0.15 + mod(abs(a.h), 70)::numeric / 100))::int
  end,
  case
    when a.show_date < (select today from base) then 'Completed'
    when mod(abs(a.h), 10) = 9 then 'Cancelled'
    else 'Scheduled'
  end
from assigned a;
