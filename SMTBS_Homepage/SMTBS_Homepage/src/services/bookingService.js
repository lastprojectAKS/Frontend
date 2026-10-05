import { supabase } from "../lib/supabaseClient";
import { invokeFunction } from "../lib/invokeFunction";

// Cancels the booking and refunds a paid booking through Stripe. The cutoff
// and the refund both happen server-side in the cancel-booking Edge Function.
export async function cancelBooking(bookingId) {
  await invokeFunction("cancel-booking", { bookingId });
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
