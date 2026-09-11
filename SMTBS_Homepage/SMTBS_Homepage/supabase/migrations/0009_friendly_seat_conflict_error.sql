-- book_seats() lets every validation failure raise a clean, customer-facing
-- message ("This showtime is no longer available.", etc.) except the one
-- that matters most: when the unique index actually catches a real
-- double-booking attempt, Postgres's raw "duplicate key value violates
-- unique constraint booking_seats_active_uk" text was passed straight
-- through to error.message and would have shown verbatim in the Checkout
-- error banner. This wraps just that insert in an exception handler so the
-- guard's behavior is unchanged (still atomic, still rolls back the whole
-- booking) but the message a customer sees is readable.
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

  return v_booking;
end;
$$;

grant execute on function public.book_seats(uuid, text[]) to authenticated;
