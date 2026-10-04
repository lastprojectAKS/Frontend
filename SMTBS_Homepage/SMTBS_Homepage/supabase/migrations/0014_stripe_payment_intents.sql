-- Real Stripe payments (test mode). Two things are added:
--
-- 1. quote_booking() — a read-only mirror of book_seats()'s pricing loop,
--    with no writes. This is what create-payment-intent (a new Supabase
--    Edge Function) calls to get the authoritative charge amount — the
--    client's own BookingContext.pricing.total is a display estimate only
--    and must never be trusted for what Stripe actually charges.
--
-- 2. book_seats() gains a third, optional p_payment_intent_id param, stored
--    on the booking row. The insert that stores it is deliberately left
--    without its own exception handler: a duplicate payment_intent_id must
--    raise a raw 23505 (unique_violation), a different error code than the
--    friendly P0001 seat-conflict exception already raised below it (from
--    0009/0011). confirm-booking (the other new Edge Function) tells
--    "this PaymentIntent was already turned into a booking, return the
--    existing one" apart from "a real seat-race failure happened, refund
--    the charge" by that distinction — don't merge the two into one
--    generic handler later.
--
-- This builds on the 0011 version of book_seats() (friendly seat-conflict
-- message + loyalty points) — 0007's version, still visible in that file,
-- is stale and was superseded twice over before this migration.
--
-- Known, accepted gap (see README): book_seats stays grant'd to
-- authenticated, and confirm-booking calls it with the paying user's own
-- forwarded JWT rather than the service role, so auth.uid() keeps
-- resolving correctly inside this security-definer function. That means an
-- authenticated client could still call book_seats directly with a
-- fabricated payment_intent_id and skip Stripe entirely — exactly as they
-- always could before this migration, since book_seats with no payment
-- step at all *was* the whole booking flow until now. Not a regression;
-- just an honest pre-existing trust boundary this change doesn't close.

create or replace function public.quote_booking(p_showtime_id uuid, p_seat_labels text[])
returns jsonb
language plpgsql
stable
as $$
declare
  v_showtime    public.showtimes%rowtype;
  v_seat_label  text;
  v_category    text;
  v_multiplier  numeric;
  v_seat_price  numeric;
  v_subtotal    numeric := 0;
  v_seat_count  integer;
  v_seats       jsonb := '[]'::jsonb;
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

  return jsonb_build_object(
    'seats', v_seats,
    'fee', 2.5,
    'subtotal', round(v_subtotal, 2),
    'total', round(v_subtotal + 2.5, 2)
  );
end;
$$;

grant execute on function public.quote_booking(uuid, text[]) to authenticated;

alter table public.bookings add column payment_intent_id text unique;

-- create or replace can't change an argument list — without this explicit
-- drop, Postgres would create a second 2-arg/3-arg overload side by side
-- instead of replacing the existing one.
drop function if exists public.book_seats(uuid, text[]);

create or replace function public.book_seats(p_showtime_id uuid, p_seat_labels text[], p_payment_intent_id text default null)
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

  update public.bookings set amount = round(v_total + 2.5, 2) where id = v_booking.id returning * into v_booking;
  update public.showtimes set booked_seats = booked_seats + v_seat_count where id = v_showtime.id;

  -- 1 point per dollar of the final charged amount, floored.
  update public.profiles set loyalty_points = loyalty_points + floor(v_booking.amount) where id = v_customer_id;

  return v_booking;
end;
$$;

grant execute on function public.book_seats(uuid, text[], text) to authenticated;
