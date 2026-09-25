-- Phase 6: loyalty points actually earned. profiles.loyalty_points has
-- existed since migration 0001 and Profile.jsx has always displayed it, but
-- nothing ever incremented it — every account showed a static 0. Rule: 1
-- point per dollar of the final charged amount (including the booking fee),
-- floored. Awarded atomically inside book_seats() (same transaction as the
-- booking itself, so a failed booking can't award points), and reversed
-- inside cancel_booking() so a cancelled/refunded booking doesn't leave
-- points behind it never should have kept.

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

    begin
      insert into public.booking_seats (booking_id, showtime_id, seat_label, category, price)
      values (v_booking.id, v_showtime.id, v_seat_label, v_category, v_seat_price);
    exception when unique_violation then
      raise exception 'Seat % was just booked by someone else. Please choose a different seat.', v_seat_label;
    end;
  end loop;

  update public.bookings set amount = round(v_total + 2.5, 2) where id = v_booking.id returning * into v_booking;
  update public.showtimes set booked_seats = booked_seats + v_seat_count where id = v_showtime.id;

  -- 1 point per dollar of the final charged amount, floored.
  update public.profiles set loyalty_points = loyalty_points + floor(v_booking.amount) where id = v_customer_id;

  return v_booking;
end;
$$;

grant execute on function public.book_seats(uuid, text[]) to authenticated;

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

  -- Reverse the points this booking earned — same formula as book_seats(),
  -- applied to the booking's own stored amount so it stays correct even if
  -- the earning rule changes later.
  update public.profiles
  set loyalty_points = greatest(0, loyalty_points - floor(v_booking.amount))
  where id = v_booking.customer_id;

  update public.bookings
  set booking_status = 'Cancelled'
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

grant execute on function public.cancel_booking(uuid) to authenticated;
