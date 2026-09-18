import { supabase } from "../lib/supabaseClient";

export async function bookSeats(showtimeId, seatLabels) {
  const { data, error } = await supabase.rpc("book_seats", {
    p_showtime_id: showtimeId,
    p_seat_labels: seatLabels,
  });
  if (error) throw new Error(error.message);
  return data;
}

// Releases the booking's seats (freeing them for resale) and marks the
// booking Cancelled. Runs as the cancel_booking() security-definer RPC so
// the seat release and the booked_seats decrement happen atomically with
// the ownership check — see supabase/migrations/0010_showtime_seed_and_cancel.sql.
export async function cancelBooking(bookingId) {
  const { error } = await supabase.rpc("cancel_booking", { p_booking_id: bookingId });
  if (error) throw new Error(error.message);
}

export async function listMyBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, booking_seats(seat_label), movie:movies(title, poster), cinema:cinemas(name)")
    .order("show_date", { ascending: false })
    .order("start_time", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    bookingCode: row.booking_code,
    movieId: row.movie_id,
    cinemaId: row.cinema_id,
    date: row.show_date,
    time: row.start_time,
    seats: row.booking_seats.map((s) => s.seat_label),
    total: row.amount,
    bookingStatus: row.booking_status,
    paymentStatus: row.payment_status,
    movie: row.movie,
    cinema: row.cinema,
  }));
}
