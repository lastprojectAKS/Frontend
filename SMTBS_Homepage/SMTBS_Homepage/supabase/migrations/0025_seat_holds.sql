-- Seat holds: a customer who reaches checkout reserves their seats for 10
-- minutes. Other customers see held seats as occupied and can't select them,
-- so two people can't both pay for the same seat. The hold is refreshed while
-- checkout stays open and released when the customer leaves it; it also expires
-- on its own if the customer walks away.
--
-- book_seats() refuses a booking whose seats another customer is holding, and
-- clears the customer's own holds once the booking is made.

create table public.seat_holds (
  showtime_id uuid not null references public.showtimes(id) on delete cascade,
  seat_label  text not null,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  expires_at  timestamptz not null,
  primary key (showtime_id, seat_label)
);

create index idx_seat_holds_customer_id on public.seat_holds (customer_id);

alter table public.seat_holds enable row level security;

-- Customers can see their own holds. Other customers' holds are only exposed as
-- seat labels through get_seat_occupancy(), never as rows.
create policy "seat_holds_own_select" on public.seat_holds
  for select using (auth.uid() = customer_id or public.is_admin());

create or replace function public.hold_seats(p_showtime_id uuid, p_seat_labels text[])
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_status  text;
  v_label   text;
  v_expires timestamptz := now() + interval '10 minutes';
begin
  if v_uid is null then
    raise exception 'Sign in to book tickets.';
  end if;
  if coalesce(array_length(p_seat_labels, 1), 0) = 0 then
    raise exception 'Select at least one seat.';
  end if;

  -- Locking the showtime serialises holds with bookings on the same showtime.
  select status into v_status from public.showtimes where id = p_showtime_id for update;
  if not found then
    raise exception 'This showtime no longer exists.';
  end if;
  if v_status <> 'Scheduled' then
    raise exception 'This showtime is no longer available.';
  end if;

  delete from public.seat_holds where showtime_id = p_showtime_id and expires_at <= now();
  delete from public.seat_holds
  where showtime_id = p_showtime_id and customer_id = v_uid and not (seat_label = any (p_seat_labels));

  foreach v_label in array p_seat_labels loop
    if exists (
      select 1 from public.booking_seats
      where showtime_id = p_showtime_id and seat_label = v_label and status = 'confirmed'
    ) then
      raise exception 'Seat % was just booked by someone else. Please choose a different seat.', v_label;
    end if;
    if exists (
      select 1 from public.seat_holds
      where showtime_id = p_showtime_id and seat_label = v_label and customer_id <> v_uid
    ) then
      raise exception 'Seat % is being reserved by another customer. Please choose a different seat.', v_label;
    end if;
    insert into public.seat_holds (showtime_id, seat_label, customer_id, expires_at)
    values (p_showtime_id, v_label, v_uid, v_expires)
    on conflict (showtime_id, seat_label)
    do update set customer_id = excluded.customer_id, expires_at = excluded.expires_at;
  end loop;

  return v_expires;
end;
$$;

create or replace function public.release_seat_holds(p_showtime_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.seat_holds where showtime_id = p_showtime_id and customer_id = auth.uid();
$$;

create or replace function public.get_seat_occupancy(p_showtime_id uuid)
returns table (seat_label text)
language sql
stable
security definer
set search_path = public
as $$
  select bs.seat_label from public.booking_seats bs
  where bs.showtime_id = p_showtime_id and bs.status = 'confirmed'
  union
  select h.seat_label from public.seat_holds h
  where h.showtime_id = p_showtime_id and h.expires_at > now() and h.customer_id <> auth.uid();
$$;

revoke all on function public.hold_seats(uuid, text[]) from public, anon;
grant execute on function public.hold_seats(uuid, text[]) to authenticated;
revoke all on function public.release_seat_holds(uuid) from public, anon;
grant execute on function public.release_seat_holds(uuid) to authenticated;
grant execute on function public.get_seat_occupancy(uuid) to anon, authenticated;

drop function if exists public.book_seats(uuid, text[], text, integer, text);

create or replace function public.book_seats(
  p_showtime_id uuid,
  p_seat_labels text[],
  p_payment_intent_id text default null,
  p_points_redeemed integer default 0,
  p_offer_code text default null
)
returns public.bookings
language plpgsql
security definer
as $$
declare
  v_showtime         public.showtimes%rowtype;
  v_customer_id      uuid := auth.uid();
  v_booking          public.bookings%rowtype;
  v_seat_label       text;
  v_category         text;
  v_multiplier       numeric;
  v_seat_price       numeric;
  v_total            numeric := 0;
  v_seat_count       integer;
  v_offer            public.offers%rowtype;
  v_offer_code       text := null;
  v_offer_discount   numeric := 0;
  v_available_points integer;
  v_max_redeemable   integer;
  v_points_redeemed  integer;
  v_discount         numeric;
begin
  if v_customer_id is null then
    raise exception 'Sign in to book tickets.';
  end if;

  perform set_config('app.trusted_loyalty', 'on', true);

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

  if exists (
    select 1 from public.seat_holds
    where showtime_id = p_showtime_id and seat_label = any (p_seat_labels)
      and customer_id <> v_customer_id and expires_at > now()
  ) then
    raise exception 'A seat you selected is being reserved by another customer. Please choose a different seat.';
  end if;

  select loyalty_points into v_available_points from public.profiles where id = v_customer_id for update;

  insert into public.bookings (customer_id, showtime_id, movie_id, cinema_id, screen_id, show_date, start_time, payment_intent_id)
  values (v_customer_id, v_showtime.id, v_showtime.movie_id, v_showtime.cinema_id, v_showtime.screen_id, v_showtime.show_date, v_showtime.start_time, p_payment_intent_id)
  returning * into v_booking;

  foreach v_seat_label in array p_seat_labels loop
    select r.category, r.price_multiplier into v_category, v_multiplier
    from public.resolve_seat_category(v_showtime.screen_id, v_seat_label) r;

    v_seat_price := round(v_showtime.price * v_multiplier, 2);
    v_total := v_total + v_seat_price;

    begin
      insert into public.booking_seats (booking_id, showtime_id, seat_label, category, price)
      values (v_booking.id, v_showtime.id, v_seat_label, v_category, v_seat_price);
    exception when unique_violation then
      raise exception 'Seat % was just booked by someone else. Please choose a different seat.', v_seat_label;
    end;
  end loop;

  if nullif(trim(coalesce(p_offer_code, '')), '') is not null then
    v_offer := public.resolve_offer(p_offer_code, v_showtime.show_date);
    v_offer_code := v_offer.code;
    v_offer_discount := public.offer_discount_amount(v_offer, v_total);
  end if;

  v_max_redeemable := greatest(0, floor((round(v_total - v_offer_discount + 2.5, 2) - 0.50) * 100))::integer;
  v_points_redeemed := least(coalesce(p_points_redeemed, 0), v_available_points, v_max_redeemable);
  v_discount := round(v_points_redeemed / 100.0, 2);

  update public.bookings
  set amount = round(v_total - v_offer_discount + 2.5 - v_discount, 2),
      points_redeemed = v_points_redeemed,
      offer_code = v_offer_code,
      offer_discount = v_offer_discount
  where id = v_booking.id
  returning * into v_booking;

  update public.showtimes set booked_seats = booked_seats + v_seat_count where id = v_showtime.id;

  update public.profiles
  set loyalty_points = loyalty_points - v_points_redeemed + floor(v_booking.amount)
  where id = v_customer_id;

  delete from public.seat_holds where showtime_id = p_showtime_id and customer_id = v_customer_id;

  return v_booking;
end;
$$;

grant execute on function public.book_seats(uuid, text[], text, integer, text) to authenticated;
