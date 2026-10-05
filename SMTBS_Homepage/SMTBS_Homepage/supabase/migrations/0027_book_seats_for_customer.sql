-- The booking logic moves into book_seats_for_customer(), which takes the
-- customer explicitly so the Stripe webhook can create a booking after a
-- payment succeeds even if the customer's browser never came back. Only the
-- server (service role) can call it. book_seats() keeps its signature and
-- still uses the signed-in user, so the checkout flow is unchanged.

create or replace function public.book_seats_for_customer(
  p_customer uuid,
  p_showtime_id uuid,
  p_seat_labels text[],
  p_payment_intent_id text default null,
  p_points_redeemed integer default 0,
  p_offer_code text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_showtime         public.showtimes%rowtype;
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
  if p_customer is null then
    raise exception 'A customer is required to book tickets.';
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
      and customer_id <> p_customer and expires_at > now()
  ) then
    raise exception 'A seat you selected is being reserved by another customer. Please choose a different seat.';
  end if;

  select loyalty_points into v_available_points from public.profiles where id = p_customer for update;

  insert into public.bookings (customer_id, showtime_id, movie_id, cinema_id, screen_id, show_date, start_time, payment_intent_id)
  values (p_customer, v_showtime.id, v_showtime.movie_id, v_showtime.cinema_id, v_showtime.screen_id, v_showtime.show_date, v_showtime.start_time, p_payment_intent_id)
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
  where id = p_customer;

  delete from public.seat_holds where showtime_id = p_showtime_id and customer_id = p_customer;

  return v_booking;
end;
$$;

revoke all on function public.book_seats_for_customer(uuid, uuid, text[], text, integer, text) from public, anon, authenticated;
grant execute on function public.book_seats_for_customer(uuid, uuid, text[], text, integer, text) to service_role;

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
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to book tickets.';
  end if;
  return public.book_seats_for_customer(auth.uid(), p_showtime_id, p_seat_labels, p_payment_intent_id, p_points_redeemed, p_offer_code);
end;
$$;

grant execute on function public.book_seats(uuid, text[], text, integer, text) to authenticated;
