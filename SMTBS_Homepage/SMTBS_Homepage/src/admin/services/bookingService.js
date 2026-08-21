import { delay } from "../lib/asyncDelay";
import { bookings, getBookingById, BOOKING_STATUSES, PAYMENT_STATUSES } from "../data/bookings";
import { showtimes, getShowtimeById } from "../data/showtimes";
import { getMovieById } from "../data/movies";
import { getCinemaById } from "../data/cinemas";
import { getScreenById } from "../data/screens";
import { getCustomerById } from "../data/customers";
import { canCancelBooking } from "../lib/businessRules";

export { BOOKING_STATUSES, PAYMENT_STATUSES };

function enrich(booking) {
  return {
    ...booking,
    movie: getMovieById(booking.movieId),
    cinema: getCinemaById(booking.cinemaId),
    screen: getScreenById(booking.screenId),
    customer: getCustomerById(booking.customerId),
  };
}

export async function listBookings() {
  await delay();
  return bookings.map(enrich);
}

export async function getBooking(id) {
  await delay();
  const booking = getBookingById(id);
  if (!booking) throw new Error(`Booking "${id}" not found.`);
  return enrich(booking);
}

export async function cancelBooking(id) {
  await delay();
  const booking = getBookingById(id);
  if (!booking) throw new Error(`Booking "${id}" not found.`);

  const { allowed, reason } = canCancelBooking(booking);
  if (!allowed) throw new Error(reason);

  const index = bookings.findIndex((b) => b.id === id);
  bookings[index] = { ...booking, bookingStatus: "Cancelled" };

  // Freeing the seats keeps the showtime's occupancy honest.
  const showtimeIndex = showtimes.findIndex((s) => s.id === booking.showtimeId);
  if (showtimeIndex !== -1) {
    showtimes[showtimeIndex] = {
      ...showtimes[showtimeIndex],
      bookedSeats: Math.max(0, showtimes[showtimeIndex].bookedSeats - booking.seats.length),
    };
  }

  return enrich(bookings[index]);
}

export async function refundBooking(id) {
  await delay();
  const booking = getBookingById(id);
  if (!booking) throw new Error(`Booking "${id}" not found.`);
  if (booking.paymentStatus !== "Paid") {
    throw new Error("Only paid bookings can be refunded.");
  }

  const index = bookings.findIndex((b) => b.id === id);
  bookings[index] = { ...booking, paymentStatus: "Refunded", bookingStatus: "Refunded" };

  const showtimeIndex = showtimes.findIndex((s) => s.id === booking.showtimeId);
  if (showtimeIndex !== -1) {
    showtimes[showtimeIndex] = {
      ...showtimes[showtimeIndex],
      bookedSeats: Math.max(0, showtimes[showtimeIndex].bookedSeats - booking.seats.length),
    };
  }

  return enrich(bookings[index]);
}
