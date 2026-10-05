-- Cancellation now goes through an Edge Function that refunds the payment, so
-- the database cancel is no longer callable by customers directly — a direct
-- call would cancel a paid booking without refunding it.
--
-- cancel_booking_as() is the only cancel path and runs with the service role.
-- Callers pass who is acting and whether the admin override applies:
--   - the owner cancelling their own booking: subject to the 2-hour cutoff
--     and the points rule (refusal if the earned points were already spent)
--   - an admin override (cancelling someone else's booking, or a showtime
--     being cancelled): no cutoff, and the balance is clamped at zero so the
--     customer is never blocked by a cinema's decision

drop function if exists public.cancel_booking(uuid);

create or replace function public.cancel_booking_as(p_booking_id uuid, p_actor uuid, p_admin_override boolean)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking        public.bookings%rowtype;
  v_released       integer;
  v_current_points integer;
  v_starts_at      timestamptz;
begin
  perform set_config('app.trusted_loyalty', 'on', true);

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking not found.';
  end if;
  if not p_admin_override and v_booking.customer_id <> p_actor then
    raise exception 'You can only cancel your own bookings.';
  end if;
  if v_booking.booking_status <> 'Confirmed' then
    raise exception 'This booking is already %.', lower(v_booking.booking_status);
  end if;

  if not p_admin_override then
    v_starts_at := (v_booking.show_date + v_booking.start_time) at time zone 'Australia/Sydney';
    if v_starts_at - interval '2 hours' <= now() then
      raise exception 'Cancellations close 2 hours before the showing.';
    end if;
  end if;

  select loyalty_points into v_current_points from public.profiles where id = v_booking.customer_id for update;
  if not p_admin_override and v_current_points - floor(v_booking.amount) + v_booking.points_redeemed < 0 then
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
  set loyalty_points = greatest(0, loyalty_points - floor(v_booking.amount) + v_booking.points_redeemed)
  where id = v_booking.customer_id;

  update public.bookings
  set booking_status = 'Cancelled'
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

revoke all on function public.cancel_booking_as(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.cancel_booking_as(uuid, uuid, boolean) to service_role;
