-- protect_profile_privileged_columns() (0001/0003) reverts loyalty_points for
-- any logged-in non-admin session. That also blocked book_seats() and
-- cancel_booking() — they run as the customer, so the points they award,
-- deduct, or restore were silently reset. Customers never gained points.
--
-- Fix: those two functions set a transaction-local flag before touching
-- loyalty_points, and the trigger only enforces the revert when the flag
-- is absent. Direct client edits to profiles still can't change points.

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.status := old.status;
    if coalesce(current_setting('app.trusted_loyalty', true), '') <> 'on' then
      new.loyalty_points := old.loyalty_points;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

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

  v_max_redeemable := greatest(0, floor((round(v_total + 2.5, 2) - 0.50) * 100))::integer;
  v_points_redeemed := least(coalesce(p_points_redeemed, 0), v_available_points, v_max_redeemable);
  v_discount := round(v_points_redeemed / 100.0, 2);

  update public.bookings
  set amount = round(v_total + 2.5 - v_discount, 2), points_redeemed = v_points_redeemed
  where id = v_booking.id
  returning * into v_booking;

  update public.showtimes set booked_seats = booked_seats + v_seat_count where id = v_showtime.id;

  update public.profiles
  set loyalty_points = loyalty_points - v_points_redeemed + floor(v_booking.amount)
  where id = v_customer_id;

  return v_booking;
end;
$$;

grant execute on function public.book_seats(uuid, text[], text, integer) to authenticated;

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

  perform set_config('app.trusted_loyalty', 'on', true);

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
