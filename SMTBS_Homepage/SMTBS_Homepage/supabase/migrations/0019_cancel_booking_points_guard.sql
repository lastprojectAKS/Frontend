-- cancel_booking() used to clamp the balance at zero when reversing a booking
-- whose earned points had already been spent on a later booking, silently
-- letting the customer keep those points. Now the cancellation is refused
-- instead, and nothing is changed.

create or replace function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
as $$
declare
  v_booking         public.bookings%rowtype;
  v_customer_id     uuid := auth.uid();
  v_released        integer;
  v_current_points  integer;
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

  select loyalty_points into v_current_points from public.profiles where id = v_booking.customer_id for update;
  if v_current_points - floor(v_booking.amount) + v_booking.points_redeemed < 0 then
    raise exception 'This booking can''t be cancelled because the points it earned have already been spent on another booking. Please contact support.';
  end if;

  update public.booking_seats
  set status = 'released'
  where booking_id = p_booking_id and status = 'confirmed';
  get diagnostics v_released = row_count;

  update public.showtimes
  set booked_seats = greatest(0, booked_seats - v_released)
  where id = v_booking.showtime_id;

  update public.profiles
  set loyalty_points = loyalty_points - floor(v_booking.amount) + v_booking.points_redeemed
  where id = v_booking.customer_id;

  update public.bookings
  set booking_status = 'Cancelled'
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

grant execute on function public.cancel_booking(uuid) to authenticated;
