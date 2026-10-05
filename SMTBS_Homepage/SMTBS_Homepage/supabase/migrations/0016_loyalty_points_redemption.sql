-- Real loyalty point redemption. Points were already earned atomically
-- per booking (0011) and reversed on cancellation, but there was no way to
-- actually spend them. Same architecture as the Stripe pricing already
-- uses: quote_booking()/book_seats() are the only authority on the
-- redeemed amount and the resulting charge — the client's own balance
-- display is informational, never trusted for what gets deducted or
-- charged. 100 points = $1 AUD (matches the 1-point-per-dollar earn rate).

alter table public.bookings add column points_redeemed integer not null default 0;

-- No drop needed — adding a parameter with a default doesn't change the
-- call signature PostgREST/supabase-js already uses (unlike book_seats
-- below, whose argument list genuinely changes).
create or replace function public.quote_booking(p_showtime_id uuid, p_seat_labels text[], p_redeem_points boolean default false)
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

  v_order_total := round(v_subtotal + 2.5, 2);

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
    'pointsAvailable', v_available_points,
    'pointsRedeemed', v_points_redeemed,
    'discount', v_discount,
    'total', round(v_order_total - v_discount, 2)
  );
end;
$$;

grant execute on function public.quote_booking(uuid, text[], boolean) to authenticated;

-- Argument list changes here, so the old 3-arg overload must go first —
-- same reasoning as the 0014 migration's own comment on this.
drop function if exists public.book_seats(uuid, text[], text);

create or replace function public.book_seats(p_showtime_id uuid, p_seat_labels text[], p_payment_intent_id text default null, p_points_redeemed integer default 0)
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
  v_available_points integer;
  v_max_redeemable   integer;
  v_points_redeemed  integer;
  v_discount         numeric;
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

  -- Row lock, same reasoning as the showtime lock above — without it two
  -- concurrent bookings could both read the same balance and both
  -- successfully redeem it.
  select loyalty_points into v_available_points from public.profiles where id = v_customer_id for update;

  -- Booking row must exist before booking_seats can reference it (FK), but
  -- its final amount/points_redeemed aren't known until the seat loop below
  -- has run — same insert-placeholder-then-finalize shape 0014 already
  -- used for amount alone, just extended to points_redeemed too.
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

  -- Re-derive and clamp server-side rather than trusting the caller's
  -- p_points_redeemed outright — it arrives here via confirm-booking,
  -- itself reading it back from the PaymentIntent's own metadata (which
  -- create-payment-intent set from a prior quote_booking() call), so it
  -- should already be correct by construction. This is defense in depth,
  -- the same principle the charge amount itself is never trusted from the
  -- client for.
  v_max_redeemable := greatest(0, floor((round(v_total + 2.5, 2) - 0.50) * 100))::integer;
  v_points_redeemed := least(coalesce(p_points_redeemed, 0), v_available_points, v_max_redeemable);
  v_discount := round(v_points_redeemed / 100.0, 2);

  update public.bookings
  set amount = round(v_total + 2.5 - v_discount, 2), points_redeemed = v_points_redeemed
  where id = v_booking.id
  returning * into v_booking;

  update public.showtimes set booked_seats = booked_seats + v_seat_count where id = v_showtime.id;

  -- Deduct redeemed points and award newly-earned points (on the
  -- post-discount amount) in one statement.
  update public.profiles
  set loyalty_points = loyalty_points - v_points_redeemed + floor(v_booking.amount)
  where id = v_customer_id;

  return v_booking;
end;
$$;

grant execute on function public.book_seats(uuid, text[], text, integer) to authenticated;

-- Signature unchanged, no drop needed. Restores redeemed points alongside
-- the existing earned-points reversal, in the same statement.
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

  -- Reverse the points this booking earned AND restore any it redeemed —
  -- same formula as book_seats(), applied to the booking's own stored
  -- amount/points_redeemed so it stays correct even if the earning rule
  -- changes later.
  update public.profiles
  set loyalty_points = greatest(0, loyalty_points - floor(v_booking.amount) + v_booking.points_redeemed)
  where id = v_booking.customer_id;

  update public.bookings
  set booking_status = 'Cancelled'
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

grant execute on function public.cancel_booking(uuid) to authenticated;
