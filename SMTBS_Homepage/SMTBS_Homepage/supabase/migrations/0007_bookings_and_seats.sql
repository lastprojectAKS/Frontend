-- Phase 3: real bookings with a real double-booking guard. No seat hold/TTL
-- — seats are claimed atomically at final confirmation via book_seats(),
-- not reserved during browsing. A seat can theoretically be taken by
-- someone else between selection and confirm; that's surfaced to the
-- client as an error ("that seat was just taken"), not silently prevented.
-- The partial unique index below is what actually makes double-booking
-- impossible — everything else is just the transaction wrapped around it.
--
-- Seat layout is NOT a stored table — it's derived deterministically from
-- screen_seat_categories (10 seats/row, Standard rows first, then Premium,
-- then VIP), computed identically on the client (for display) and in
-- resolve_seat_category() (for authoritative pricing or, so a client can't
-- under-price a seat by lying about its category.

create sequence public.booking_code_seq;

create table public.bookings (
  id              uuid primary key default gen_random_uuid(),
  booking_code    text not null unique default ('BK-' || lpad(nextval('public.booking_code_seq')::text, 5, '0')),
  customer_id     uuid not null references public.profiles(id),
  showtime_id     uuid not null references public.showtimes(id),
  movie_id        text references public.movies(id),
  cinema_id       text references public.cinemas(id),
  screen_id       text references public.screens(id),
  show_date       date not null,
  start_time      time not null,
  amount          numeric(8, 2) not null default 0,
  payment_status  text not null default 'Paid' check (payment_status in ('Paid', 'Pending', 'Failed', 'Refunded')),
  booking_status  text not null default 'Confirmed' check (booking_status in ('Confirmed', 'Pending', 'Cancelled', 'Refunded')),
  created_at      timestamptz not null default now()
);

create table public.booking_seats (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references public.bookings(id) on delete cascade,
  showtime_id  uuid not null references public.showtimes(id),
  seat_label   text not null,
  category     text not null,
  price        numeric(6, 2) not null,
  status       text not null default 'confirmed' check (status in ('confirmed', 'released')),
  created_at   timestamptz not null default now()
);

-- The actual double-booking guard: two 'confirmed' rows can't share a
-- (showtime, seat) pair. Cancelling a booking later sets its seats to
-- 'released', dropping them out of this index and freeing them for resale.
create unique index booking_seats_active_uk on public.booking_seats (showtime_id, seat_label) where (status = 'confirmed');

alter table public.bookings enable row level security;
alter table public.booking_seats enable row level security;

create policy "bookings_select_own_or_admin" on public.bookings for select
  using (customer_id = auth.uid() or public.is_admin());
create policy "bookings_admin_update" on public.bookings for update
  using (public.is_admin()) with check (public.is_admin());
-- No insert policy for regular clients — the only way a booking row gets
-- created is through book_seats() below, which runs as security definer.

create policy "booking_seats_select_own_or_admin" on public.booking_seats for select
  using (public.is_admin() or exists (
    select 1 from public.bookings b where b.id = booking_seats.booking_id and b.customer_id = auth.uid()
  ));

-- Resolves which category (and therefore price multiplier) a seat label
-- belongs to, using the same row-block layout the client renders — the
-- server never trusts a client-supplied category.
create or replace function public.resolve_seat_category(p_screen_id text, p_seat_label text)
returns table (category text, price_multiplier numeric)
language plpgsql
stable
as $$
declare
  v_row_letter  text := upper(substring(p_seat_label from '^[A-Za-z]+'));
  v_row_index   integer;
  v_cat         record;
  v_rows_used   integer := 0;
  v_rows_needed integer;
begin
  if v_row_letter is null or v_row_letter = '' then
    raise exception 'Invalid seat label %', p_seat_label;
  end if;
  v_row_index := ascii(v_row_letter) - ascii('A');

  for v_cat in
    select c.category as cat_name, c.seat_count, c.price_multiplier as mult
    from public.screen_seat_categories c
    where c.screen_id = p_screen_id
    order by case c.category when 'Standard' then 1 when 'Premium' then 2 when 'VIP' then 3 end
  loop
    v_rows_needed := ceil(v_cat.seat_count::numeric / 10);
    if v_row_index < v_rows_used + v_rows_needed then
      category := v_cat.cat_name;
      price_multiplier := v_cat.mult;
      return next;
      return;
    end if;
    v_rows_used := v_rows_used + v_rows_needed;
  end loop;

  raise exception 'Seat % does not exist on this screen', p_seat_label;
end;
$$;

create or replace function public.book_seats(p_showtime_id uuid, p_seat_labels text[])
returns public.bookings
language plpgsql
security definer
as $$
declare
  v_showtime    public.showtimes%rowtype;
  v_customer_id uuid := auth.uid();
  v_booking     public.bookings%rowtype;
  v_seat_label  text;
  v_category    text;
  v_multiplier  numeric;
  v_seat_price  numeric;
  v_total       numeric := 0;
  v_seat_count  integer;
begin
  if v_customer_id is null then
    raise exception 'Sign in to book tickets.';
  end if;

  select * into v_showtime from public.showtimes where id = p_showtime_id for update;
  if not found then
    raise exception 'This showtime no longer exists.';
  end if;
  if v_showtime.status <> 'Scheduled' then
    raise exception 'This showtime is no longer available.';
  end if;

  v_seat_count := coalesce(array_length(p_seat_labels, 1), 0);
  if v_seat_count = 0 then
    raise exception 'Select at least one seat.';
  end if;
  if v_seat_count > 8 then
    raise exception 'A maximum of 8 seats can be booked at once.';
  end if;

  insert into public.bookings (customer_id, showtime_id, movie_id, cinema_id, screen_id, show_date, start_time)
  values (v_customer_id, v_showtime.id, v_showtime.movie_id, v_showtime.cinema_id, v_showtime.screen_id, v_showtime.show_date, v_showtime.start_time)
  returning * into v_booking;

  foreach v_seat_label in array p_seat_labels loop
    select r.category, r.price_multiplier into v_category, v_multiplier
    from public.resolve_seat_category(v_showtime.screen_id, v_seat_label) r;

    v_seat_price := round(v_showtime.price * v_multiplier, 2);
    v_total := v_total + v_seat_price;

    -- If this seat is already 'confirmed' for this showtime, the unique
    -- index raises here and the whole transaction (booking included)
    -- rolls back — no partial booking, no race window.
    insert into public.booking_seats (booking_id, showtime_id, seat_label, category, price)
    values (v_booking.id, v_showtime.id, v_seat_label, v_category, v_seat_price);
  end loop;

  update public.bookings set amount = round(v_total + 2.5, 2) where id = v_booking.id returning * into v_booking;
  update public.showtimes set booked_seats = booked_seats + v_seat_count where id = v_showtime.id;

  return v_booking;
end;
$$;

grant execute on function public.book_seats(uuid, text[]) to authenticated;
