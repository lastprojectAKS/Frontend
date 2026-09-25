// Central place for the platform's operational rules. Pages call these
// instead of re-implementing checks inline, so the rule lives in exactly
// one place and every screen enforces it the same way.
//
// Mid-migration state: canDeleteMovie()/findShowtimeConflict()/
// canDeleteShowtime() below check real Supabase tables (Movies, Cinemas &
// Screens, and now Showtimes are all migrated) and are therefore async.
// canReduceScreenCapacity()/canDeactivateCinema() made the same move earlier
// and live in admin/services/cinemaService.js instead, to avoid a
// cinemaService ↔ businessRules circular import. Only Bookings/Customers
// still read admin's mock data — that split resolves itself as each
// resource migrates in turn.

import { supabase } from "../../lib/supabaseClient";

function toMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * A soft, advisory pre-check so the form can show a conflict warning before
 * the admin even tries to save — but the real, authoritative guard is the
 * `exclude using gist` constraint on public.showtimes (see migration 0006).
 * That constraint can't be bypassed even if this check somehow misses a
 * case; showtimeService.js's create/updateShowtime translate its raw
 * exclusion-violation error into the same friendly message either way.
 */
export async function findShowtimeConflict({ screenId, date, startTime, endTime, excludeShowtimeId }) {
  const { data, error } = await supabase
    .from("showtimes")
    .select("id, movie_id, start_time, end_time")
    .eq("screen_id", screenId)
    .eq("show_date", date)
    .neq("status", "Cancelled");
  if (error) throw error;

  const newStart = toMinutes(startTime);
  const newEnd = toMinutes(endTime);

  const conflict = data.find((s) => {
    if (s.id === excludeShowtimeId) return false;
    const existingStart = toMinutes(s.start_time);
    const existingEnd = toMinutes(s.end_time);
    return newStart < existingEnd && existingStart < newEnd;
  });

  if (!conflict) return null;
  return { id: conflict.id, movieId: conflict.movie_id, startTime: conflict.start_time.slice(0, 5), endTime: conflict.end_time.slice(0, 5) };
}

export function validateShowtimeTimes(startTime, endTime) {
  if (!startTime || !endTime) return "Start and end time are required.";
  if (toMinutes(endTime) <= toMinutes(startTime)) return "End time must be after start time.";
  return null;
}

export function isShowtimeInPast(showtime, today = new Date().toISOString().slice(0, 10)) {
  return showtime.date < today;
}

export async function canDeleteShowtime(showtimeId) {
  const { count, error } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("showtime_id", showtimeId)
    .neq("booking_status", "Cancelled");
  if (error) throw error;

  const hasBookings = (count ?? 0) > 0;
  return { allowed: !hasBookings, reason: hasBookings ? "This showtime has existing bookings and can only be cancelled, not deleted." : null };
}

export async function canDeleteMovie(movieId) {
  const { count, error } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("movie_id", movieId)
    .neq("booking_status", "Cancelled");
  if (error) throw error;

  const hasBookings = (count ?? 0) > 0;
  return {
    allowed: !hasBookings,
    reason: hasBookings
      ? "This movie has existing bookings. Deactivate it instead of deleting — deleting would orphan booking history."
      : null,
  };
}

export function canCreateShowtimeForMovie(movie) {
  const allowedStatuses = ["Now Showing", "Upcoming"];
  return {
    allowed: allowedStatuses.includes(movie.status),
    reason: allowedStatuses.includes(movie.status)
      ? null
      : `"${movie.title}" is ${movie.status.toLowerCase()} and can't be scheduled. Only Now Showing or Upcoming movies can have showtimes.`,
  };
}

export function canCreateShowtimeForScreen(screen, cinema) {
  if (cinema.status !== "Active") {
    return { allowed: false, reason: `${cinema.name} is inactive. Activate the cinema before scheduling shows there.` };
  }
  if (screen.status !== "Active") {
    return { allowed: false, reason: `${screen.name} is inactive. Activate the screen before scheduling shows on it.` };
  }
  return { allowed: true, reason: null };
}

export function canCancelBooking(booking) {
  return {
    allowed: booking.bookingStatus === "Confirmed" || booking.bookingStatus === "Pending",
    reason: booking.bookingStatus === "Cancelled" || booking.bookingStatus === "Refunded"
      ? "This booking is already cancelled or refunded."
      : null,
  };
}

export function calculateOccupancy(bookedSeats, totalSeats) {
  if (!totalSeats) return 0;
  return Math.min(1, bookedSeats / totalSeats);
}
