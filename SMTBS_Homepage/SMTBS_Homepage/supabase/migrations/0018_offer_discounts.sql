-- Promo codes that actually discount a booking. Offers used to be display
-- text only ("20% OFF", "Mon–Thu") that the server could not calculate with.
-- The discount now lives in structured columns, and quote_booking()/
-- book_seats() remain the only authority on the amount — same rule as
-- loyalty points. Offer discounts apply to the seat subtotal before the
-- booking fee; loyalty points then apply to what remains (min $0.50).

alter table public.offers
  add column discount_type  text check (discount_type in ('percent', 'fixed')),
  add column discount_value numeric(8, 2) check (discount_value > 0),
  add column days_of_week   integer[] check (days_of_week is null or days_of_week <@ array[0, 1, 2, 3, 4, 5, 6]),
  add column valid_from     date,
  add column valid_until    date,
  add column active         boolean not null default true,
  add constraint offers_valid_range check (valid_from is null or valid_until is null or valid_until >= valid_from);

-- days_of_week uses Postgres dow numbering: 0 = Sunday … 6 = Saturday.
update public.offers set discount_type = 'percent', discount_value = 20, days_of_week = '{1,2,3,4}' where id = 'student-discount';
update public.offers set discount_type = 'fixed', discount_value = 15, days_of_week = '{0,6}' where id = 'weekend-family';
update public.offers set discount_type = 'percent', discount_value = 15, days_of_week = '{5,6,0}' where id = 'couples-package';

-- Offers without a defined amount (TUESDAY8's flat $8 ticket price is not a
-- discount type we support, and any admin-created rows from before this
-- migration have no amount) cannot be applied, so they are switched off
-- rather than guessed at.
update public.offers set active = false where discount_type is null;

alter table public.offers
  add constraint offers_active_needs_discount check (not active or (discount_type is not null and discount_value is not null));

alter table public.bookings
  add column offer_code     text,
  add column offer_discount numeric(8, 2) not null default 0;

-- Single source of truth for whether a code can be used on a given show date.
create or replace function public.resolve_offer(p_code text, p_show_date date)
returns public.offers
language plpgsql
stable
as $$
declare
  v_offer public.offers%rowtype;
begin
  select * into v_offer
  from public.offers
  where upper(code) = upper(trim(p_code))
  limit 1;

  if not found or not v_offer.active then
    raise exception 'That promo code is not valid.';
  end if;
  if (v_offer.valid_from is not null and p_show_date < v_offer.valid_from)
     or (v_offer.valid_until is not null and p_show_date > v_offer.valid_until) then
    raise exception 'That promo code is not valid for this showtime''s date.';
  end if;
  if v_offer.days_of_week is not null
     and not (extract(dow from p_show_date)::integer = any (v_offer.days_of_week)) then
    raise exception 'That promo code is not valid on this day of the week.';
  end if;

  return v_offer;
end;
$$;

create or replace function public.offer_discount_amount(p_offer public.offers, p_subtotal numeric)
returns numeric
language sql
immutable
as $$
  select least(
    p_subtotal,
    case p_offer.discount_type
      when 'percent' then round(p_subtotal * p_offer.discount_value / 100, 2)
      else p_offer.discount_value
    end
  );
$$;

-- Argument list changes, so the old 3-arg overload must go first.
drop function if exists public.quote_booking(uuid, text[], boolean);

create or replace function public.quote_booking(
  p_showtime_id uuid,
  p_seat_labels text[],
  p_redeem_points boolean default false,
  p_offer_code text default null
)
returns jsonb
language plpgsql
stable
as $$
declare
  v_showtime            public.showtimes%rowtype;
  v_seat_label          text;
  v_category            text;
  v_multiplier          numeric;
  v_seat_price          numeric;
  v_subtotal            numeric := 0;
  v_seat_count          integer;
  v_seats               jsonb := '[]'::jsonb;
  v_offer               public.offers%rowtype;
  v_offer_code          text := null;
  v_offer_discount      numeric := 0;
  v_available_points    integer;
  v_order_total         numeric;
  v_max_redeemable      integer;
  v_points_redeemed     integer;
  v_discount            numeric;
begin
  select * into v_showtime from public.showtimes where id = p_showtime_id;
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

  foreach v_seat_label in array p_seat_labels loop
    select r.category, r.price_multiplier into v_category, v_multiplier
    from public.resolve_seat_category(v_showtime.screen_id, v_seat_label) r;

    v_seat_price := round(v_showtime.price * v_multiplier, 2);
    v_subtotal := v_subtotal + v_seat_price;
    v_seats := v_seats || jsonb_build_object('seat_label', v_seat_label, 'category', v_category, 'price', v_seat_price);
  end loop;

  if nullif(trim(coalesce(p_offer_code, '')), '') is not null then
    v_offer := public.resolve_offer(p_offer_code, v_showtime.show_date);
    v_offer_code := v_offer.code;
    v_offer_discount := public.offer_discount_amount(v_offer, v_subtotal);
  end if;

  v_order_total := round(v_subtotal - v_offer_discount + 2.5, 2);

  v_available_points := coalesce((select loyalty_points from public.profiles where id = auth.uid()), 0);
  -- Keep at least $0.50 payable — Stripe can't charge a $0 PaymentIntent,
  -- so points can discount an order down close to zero but never to it.
  v_max_redeemable := greatest(0, floor((v_order_total - 0.50) * 100))::integer;
  v_points_redeemed := case when p_redeem_points then least(v_available_points, v_max_redeemable) else 0 end;
  v_discount := round(v_points_redeemed / 100.0, 2);

  return jsonb_build_object(
    'seats', v_seats,
    'fee', 2.5,
    'subtotal', round(v_subtotal, 2),
    'offerCode', v_offer_code,
    'offerDiscount', v_offer_discount,
    'pointsAvailable', v_available_points,
    'pointsRedeemed', v_points_redeemed,
    'discount', v_discount,
    'total', round(v_order_total - v_discount, 2)
  );
end;
$$;

grant execute on function public.quote_booking(uuid, text[], boolean, text) to authenticated;

-- Argument list changes, so the old 4-arg overload must go first.
drop function if exists public.book_seats(uuid, text[], text, integer);

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

  -- Re-validated here rather than trusted from the PaymentIntent: a rejected
  -- code raises, which rolls back this whole booking and triggers the
  -- refund path in confirm-booking.
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

  return v_booking;
end;
$$;

grant execute on function public.book_seats(uuid, text[], text, integer, text) to authenticated;
