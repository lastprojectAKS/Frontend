import { supabase } from "../../lib/supabaseClient";
import { invokeFunction } from "../../lib/invokeFunction";

export const BOOKING_STATUSES = ["Confirmed", "Pending", "Cancelled", "Refunded"];
export const PAYMENT_STATUSES = ["Paid", "Pending", "Failed", "Refunded"];

// id is the real uuid (used for routing/RPC calls); bookingCode is the
// human-readable "BK-00001" — same split the customer-facing bookingService
// already uses. The admin UI displays bookingCode, never the raw uuid.
const SELECT_WITH_JOINS =
  "*, booking_seats(seat_label), movie:movies(id,title,poster), cinema:cinemas(id,name), screen:screens(id,name), customer:profiles(id,name,email)";

function mapRow(row) {
  return {
    id: row.id,
    bookingCode: row.booking_code,
    showtimeId: row.showtime_id,
    movieId: row.movie_id,
    cinemaId: row.cinema_id,
    screenId: row.screen_id,
    date: row.show_date,
    startTime: row.start_time?.slice(0, 5),
    customerId: row.customer_id,
    seats: (row.booking_seats ?? []).map((s) => s.seat_label),
    amount: Number(row.amount),
    paymentStatus: row.payment_status,
    bookingStatus: row.booking_status,
    createdAt: row.created_at,
    movie: row.movie,
    cinema: row.cinema,
    screen: row.screen,
    customer: row.customer,
  };
}

export async function listBookings() {
  const { data, error } = await supabase.from("bookings").select(SELECT_WITH_JOINS).order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapRow);
}

export async function getBooking(id) {
  const { data, error } = await supabase.from("bookings").select(SELECT_WITH_JOINS).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Booking "${id}" not found.`);
  return mapRow(data);
}

// Same cancel-booking Edge Function customers use. For an admin cancelling
// someone else's booking it skips the cutoff and does not refund — refunds
// are a separate action below.
export async function cancelBooking(id) {
  await invokeFunction("cancel-booking", { bookingId: id });
  return getBooking(id);
}

// A refund is a cancellation (same seat-release/occupancy logic) plus
// actually returning the customer's money. For a booking paid through
// Stripe, that only the refund-booking Edge Function can do — it holds the
// Stripe secret key, re-verifies admin status server-side, and only flips
// the DB to Refunded once Stripe confirms the charge was actually reversed
// (or finds it already was, on a retry). See its own comments for why the
// admin check can't be left to RLS alone here. Bookings that predate
// Stripe (no payment_intent_id) just get the same status flip as before.
export async function refundBooking(id) {
  await invokeFunction("refund-booking", { bookingId: id });
  return getBooking(id);
}
