// Unlike the other files in this folder, nothing here is a stored "table" —
// it's all derived from bookings.js/showtimes.js on demand. A real backend
// would expose these as pre-aggregated endpoints; keeping the shape the
// same here means admin/services/analyticsService.js won't need to change
// when that happens, only what it calls underneath.

import { bookings, isRevenueCountable } from "./bookings";
import { showtimes } from "./showtimes";
import { movies, getMovieById } from "./movies";
import { cinemas, getCinemaById } from "./cinemas";
import { screens, getScreenById, getScreenCapacity } from "./screens";
import { customers, getCustomerById } from "./customers";
import { addDays, dateRangeBetween } from "../lib/dateUtils";

const TODAY = "2026-08-21";

export function getDateRange(days) {
  return Array.from({ length: days }, (_, i) => addDays(TODAY, -(days - 1 - i)));
}

export function getRevenueSeries(days = 30) {
  const range = getDateRange(days);
  const byDate = new Map(range.map((d) => [d, 0]));

  bookings.forEach((b) => {
    if (!isRevenueCountable(b)) return;
    const day = b.createdAt.slice(0, 10);
    if (byDate.has(day)) byDate.set(day, byDate.get(day) + b.amount);
  });

  return range.map((date) => ({ date, revenue: Math.round(byDate.get(date) * 100) / 100 }));
}

export function getBookingsSeries(days = 30) {
  const range = getDateRange(days);
  const byDate = new Map(range.map((d) => [d, { date: d, confirmed: 0, pending: 0, cancelled: 0, refunded: 0 }]));

  bookings.forEach((b) => {
    const day = b.createdAt.slice(0, 10);
    const bucket = byDate.get(day);
    if (!bucket) return;
    const key = b.bookingStatus.toLowerCase();
    if (key in bucket) bucket[key] += 1;
  });

  return range.map((date) => byDate.get(date));
}

// Range-bound variants of the series above, for the Reports page's date
// range picker (Today / Last 7 days / custom, etc). The dashboard's
// trailing-N-days versions stay separate since they always anchor to today.
export function getRevenueSeriesForRange(startDate, endDate) {
  const range = dateRangeBetween(startDate, endDate);
  const byDate = new Map(range.map((d) => [d, 0]));

  bookings.forEach((b) => {
    if (!isRevenueCountable(b)) return;
    const day = b.createdAt.slice(0, 10);
    if (byDate.has(day)) byDate.set(day, byDate.get(day) + b.amount);
  });

  return range.map((date) => ({ date, revenue: Math.round(byDate.get(date) * 100) / 100 }));
}

export function getBookingsSeriesForRange(startDate, endDate) {
  const range = dateRangeBetween(startDate, endDate);
  const byDate = new Map(range.map((d) => [d, { date: d, confirmed: 0, pending: 0, cancelled: 0, refunded: 0 }]));

  bookings.forEach((b) => {
    const day = b.createdAt.slice(0, 10);
    const bucket = byDate.get(day);
    if (!bucket) return;
    const key = b.bookingStatus.toLowerCase();
    if (key in bucket) bucket[key] += 1;
  });

  return range.map((date) => byDate.get(date));
}

export function getBookingStatusDistributionForRange(startDate, endDate) {
  const counts = { Confirmed: 0, Pending: 0, Cancelled: 0, Refunded: 0 };
  bookings.forEach((b) => {
    const day = b.createdAt.slice(0, 10);
    if (day < startDate || day > endDate) return;
    counts[b.bookingStatus] = (counts[b.bookingStatus] || 0) + 1;
  });
  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}

export function getTopCustomers(limit = 5) {
  return customers
    .map((customer) => {
      const customerBookings = bookings.filter((b) => b.customerId === customer.id);
      const totalSpent = customerBookings.filter(isRevenueCountable).reduce((sum, b) => sum + b.amount, 0);
      return { customer, totalBookings: customerBookings.length, totalSpent: Math.round(totalSpent * 100) / 100 };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

export function getBookingStatusDistribution() {
  const counts = { Confirmed: 0, Pending: 0, Cancelled: 0, Refunded: 0 };
  bookings.forEach((b) => {
    counts[b.bookingStatus] = (counts[b.bookingStatus] || 0) + 1;
  });
  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}

export function getMovieStats(movieId) {
  const movieShowtimes = showtimes.filter((s) => s.movieId === movieId);
  const movieBookings = bookings.filter((b) => b.movieId === movieId);

  const ticketsSold = movieBookings
    .filter((b) => b.bookingStatus === "Confirmed")
    .reduce((sum, b) => sum + b.seats.length, 0);

  const revenue = movieBookings.filter(isRevenueCountable).reduce((sum, b) => sum + b.amount, 0);

  const totalCapacity = movieShowtimes.reduce((sum, s) => sum + s.totalSeats, 0);
  const totalBooked = movieShowtimes.reduce((sum, s) => sum + s.bookedSeats, 0);
  const occupancy = totalCapacity > 0 ? totalBooked / totalCapacity : 0;

  return { ticketsSold, revenue: Math.round(revenue * 100) / 100, occupancy, showtimeCount: movieShowtimes.length };
}

export function getTopMovies(limit = 5) {
  return movies
    .map((movie) => ({ movie, ...getMovieStats(movie.id) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function getCinemaStats(cinemaId) {
  const cinemaScreens = screens.filter((s) => s.cinemaId === cinemaId);
  const cinemaBookings = bookings.filter((b) => b.cinemaId === cinemaId);
  const cinemaShowtimes = showtimes.filter((s) => s.cinemaId === cinemaId);

  const revenue = cinemaBookings.filter(isRevenueCountable).reduce((sum, b) => sum + b.amount, 0);
  const totalCapacity = cinemaShowtimes.reduce((sum, s) => sum + s.totalSeats, 0);
  const totalBooked = cinemaShowtimes.reduce((sum, s) => sum + s.bookedSeats, 0);

  return {
    revenue: Math.round(revenue * 100) / 100,
    bookingCount: cinemaBookings.length,
    screenCount: cinemaScreens.length,
    occupancy: totalCapacity > 0 ? totalBooked / totalCapacity : 0,
  };
}

export function getTopCinemas(limit = 5) {
  return cinemas
    .map((cinema) => ({ cinema, ...getCinemaStats(cinema.id) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function getScreenOccupancy() {
  return screens.map((screen) => {
    const screenShowtimes = showtimes.filter((s) => s.screenId === screen.id && s.status !== "Cancelled");
    const capacity = getScreenCapacity(screen);
    const totalSlots = screenShowtimes.reduce((sum, s) => sum + s.totalSeats, 0);
    const totalBooked = screenShowtimes.reduce((sum, s) => sum + s.bookedSeats, 0);
    return {
      screen,
      cinema: getCinemaById(screen.cinemaId),
      capacity,
      occupancy: totalSlots > 0 ? totalBooked / totalSlots : 0,
    };
  });
}

export function getDashboardSummary() {
  const totalRevenue = bookings.filter(isRevenueCountable).reduce((sum, b) => sum + b.amount, 0);
  const today = "2026-08-21";

  const todayBookings = bookings.filter((b) => b.createdAt.slice(0, 10) === today);
  const todayRevenue = todayBookings.filter(isRevenueCountable).reduce((sum, b) => sum + b.amount, 0);

  const upcomingShows = showtimes.filter((s) => s.date >= today && s.status === "Scheduled").length;

  const activeShowtimes = showtimes.filter((s) => s.status !== "Cancelled");
  const totalCapacity = activeShowtimes.reduce((sum, s) => sum + s.totalSeats, 0);
  const totalBooked = activeShowtimes.reduce((sum, s) => sum + s.bookedSeats, 0);
  const occupancyRate = totalCapacity > 0 ? totalBooked / totalCapacity : 0;

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalBookings: bookings.length,
    totalCustomers: new Set(bookings.map((b) => b.customerId)).size,
    activeMovies: movies.filter((m) => m.status === "Now Showing").length,
    todayRevenue: Math.round(todayRevenue * 100) / 100,
    todayBookings: todayBookings.length,
    upcomingShows,
    occupancyRate,
  };
}

export function getRecentBookings(limit = 8) {
  return bookings
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map((b) => ({
      booking: { ...b, customer: getCustomerById(b.customerId) },
      movie: getMovieById(b.movieId),
      cinema: getCinemaById(b.cinemaId),
    }));
}

export function getUpcomingShows(limit = 8) {
  const today = "2026-08-21";
  return showtimes
    .filter((s) => s.date >= today && s.status === "Scheduled")
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .slice(0, limit)
    .map((s) => ({
      showtime: s,
      movie: getMovieById(s.movieId),
      cinema: getCinemaById(s.cinemaId),
      screen: getScreenById(s.screenId),
      occupancy: s.totalSeats > 0 ? s.bookedSeats / s.totalSeats : 0,
    }));
}
