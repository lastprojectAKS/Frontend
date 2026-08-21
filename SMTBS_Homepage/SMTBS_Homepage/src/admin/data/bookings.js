import { showtimes } from "./showtimes";
import { customers } from "./customers";
import { addDays } from "../lib/dateUtils";

export const BOOKING_STATUSES = ["Confirmed", "Pending", "Cancelled", "Refunded"];
export const PAYMENT_STATUSES = ["Paid", "Pending", "Failed", "Refunded"];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seatLabel(index) {
  const rows = "ABCDEFGH";
  return `${rows[Math.floor(index / 10) % rows.length]}${(index % 10) + 1}`;
}

function daysBefore(dateStr, days) {
  return new Date(`${addDays(dateStr, -days)}T00:00:00Z`);
}

let seed = [];
let counter = 1;

showtimes.forEach((showtime) => {
  if (showtime.bookedSeats <= 0) return;

  const seed1 = hashString(showtime.id);
  const bookingCount = showtime.bookedSeats <= 3 ? 1 : showtime.bookedSeats <= 8 ? 2 : 3;
  let remaining = showtime.bookedSeats;
  let seatCursor = seed1 % 30;

  for (let b = 0; b < bookingCount; b += 1) {
    const isLast = b === bookingCount - 1;
    const seatsForBooking = isLast
      ? remaining
      : Math.max(1, Math.round(remaining / (bookingCount - b) - 0.4));
    remaining -= seatsForBooking;
    if (seatsForBooking <= 0) continue;

    const seats = Array.from({ length: seatsForBooking }, (_, i) => seatLabel(seatCursor + i));
    seatCursor += seatsForBooking + 1;

    const customer = customers[(seed1 + b * 7) % customers.length];
    const amount = Math.round(seatsForBooking * showtime.price * 1.0 * 100) / 100 + 2.5;

    const roll = (seed1 + b * 13) % 20;
    let bookingStatus = "Confirmed";
    let paymentStatus = "Paid";

    if (showtime.status === "Cancelled") {
      bookingStatus = "Refunded";
      paymentStatus = "Refunded";
    } else if (roll === 0) {
      bookingStatus = "Cancelled";
      paymentStatus = "Refunded";
    } else if (roll === 1) {
      bookingStatus = "Pending";
      paymentStatus = "Pending";
    } else if (roll === 2 && showtime.status !== "Completed") {
      bookingStatus = "Pending";
      paymentStatus = "Failed";
    }

    const leadDays = 1 + ((seed1 + b) % 14);
    const createdAt = daysBefore(showtime.date, -0 - leadDays >= 0 ? leadDays : 1).toISOString();

    seed.push({
      id: `BK-${String(counter).padStart(5, "0")}`,
      showtimeId: showtime.id,
      movieId: showtime.movieId,
      cinemaId: showtime.cinemaId,
      screenId: showtime.screenId,
      date: showtime.date,
      startTime: showtime.startTime,
      customerId: customer.id,
      seats,
      amount,
      paymentStatus,
      bookingStatus,
      createdAt,
    });
    counter += 1;
  }
});

// Exported as a mutable "table" — admin/services/bookingService.js is the
// only thing that should mutate this array (cancel/refund).
export const bookings = seed;

export const getBookingById = (id) => bookings.find((b) => b.id === id);

export const getBookingsForCustomer = (customerId) =>
  bookings.filter((b) => b.customerId === customerId);

export const getBookingsForMovie = (movieId) => bookings.filter((b) => b.movieId === movieId);

// Revenue only counts bookings that were actually paid and not later
// refunded/cancelled — this is the "revenue from completed/paid bookings
// only" rule from the brief, applied everywhere revenue is summed.
export const isRevenueCountable = (booking) =>
  booking.paymentStatus === "Paid" && booking.bookingStatus === "Confirmed";
