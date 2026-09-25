import { supabase } from "../../lib/supabaseClient";

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

// Reuses the same cancel_booking() RPC the customer-facing checkout flow
// calls (supabase/migrations/0010) — it already permits an admin to cancel
// any booking (not just their own), releases the seats, and decrements
// showtimes.booked_seats atomically. No separate admin-only path needed.
export async function cancelBooking(id) {
  const { error } = await supabase.rpc("cancel_booking", { p_booking_id: id });
  if (error) throw new Error(error.message);
  return getBooking(id);
}

// A refund is a cancellation (same seat-release/occupancy logic) plus a
// distinct terminal status the plain cancel_booking() RPC doesn't set on
// its own — so this calls it first, then flips both statuses to Refunded
// via a direct update, which bookings_admin_update's RLS policy allows.
export async function refundBooking(id) {
  const existing = await getBooking(id);
  if (existing.paymentStatus !== "Paid") {
    throw new Error("Only paid bookings can be refunded.");
  }

  const { error: cancelError } = await supabase.rpc("cancel_booking", { p_booking_id: id });
  if (cancelError) throw new Error(cancelError.message);

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ payment_status: "Refunded", booking_status: "Refunded" })
    .eq("id", id);
  if (updateError) throw updateError;

  return getBooking(id);
}
