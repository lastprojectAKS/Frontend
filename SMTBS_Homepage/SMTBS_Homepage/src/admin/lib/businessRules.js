// Central place for the platform's operational rules. Pages call these
// instead of re-implementing checks inline, so the rule lives in exactly
// one place and every screen enforces it the same way.

import { showtimes } from "../data/showtimes";
import { bookings } from "../data/bookings";
import { getScreenCapacity } from "../data/screens";

function toMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Two showtimes on the same screen/date overlap if one starts before the
 * other ends. Cancelled showtimes don't block new ones from reusing the slot.
 */
export function findShowtimeConflict({ screenId, date, startTime, endTime, excludeShowtimeId }) {
  const newStart = toMinutes(startTime);
  const newEnd = toMinutes(endTime);

  const conflict = showtimes.find((s) => {
    if (s.id === excludeShowtimeId) return false;
    if (s.screenId !== screenId || s.date !== date) return false;
    if (s.status === "Cancelled") return false;

    const existingStart = toMinutes(s.startTime);
    const existingEnd = toMinutes(s.endTime);
    return newStart < existingEnd && existingStart < newEnd;
  });

  return conflict || null;
}

export function validateShowtimeTimes(startTime, endTime) {
  if (!startTime || !endTime) return "Start and end time are required.";
  if (toMinutes(endTime) <= toMinutes(startTime)) return "End time must be after start time.";
  return null;
}

export function isShowtimeInPast(showtime, today = "2026-08-21") {
  return showtime.date < today;
}

export function canDeleteShowtime(showtimeId) {
  const hasBookings = bookings.some((b) => b.showtimeId === showtimeId && b.bookingStatus !== "Cancelled");
  return { allowed: !hasBookings, reason: hasBookings ? "This showtime has existing bookings and can only be cancelled, not deleted." : null };
}

export function canDeleteMovie(movieId) {
  const hasBookings = bookings.some((b) => b.movieId === movieId && b.bookingStatus !== "Cancelled");
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

/**
 * A screen's capacity can never drop below the largest showtime it has
 * already sold seats for — shrinking it further would leave bookings
 * pointing at seats that no longer exist.
 */
export function canReduceScreenCapacity(screenId, newCapacity) {
  const screenShowtimes = showtimes.filter((s) => s.screenId === screenId && s.status !== "Cancelled");
  const maxBooked = screenShowtimes.reduce((max, s) => Math.max(max, s.bookedSeats), 0);

  return {
    allowed: newCapacity >= maxBooked,
    reason:
      newCapacity >= maxBooked
        ? null
        : `This screen has a showtime with ${maxBooked} seats already booked. Capacity can't drop below that.`,
  };
}

export function canDeactivateCinema(cinemaId, today = "2026-08-21") {
  const upcoming = showtimes.some(
    (s) => s.cinemaId === cinemaId && s.date >= today && s.status === "Scheduled"
  );
  return {
    allowed: true,
    warning: upcoming
      ? "This cinema has upcoming scheduled showtimes. Deactivating it will hide it from customers, but existing showtimes and bookings are preserved."
      : null,
  };
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

export { getScreenCapacity };
