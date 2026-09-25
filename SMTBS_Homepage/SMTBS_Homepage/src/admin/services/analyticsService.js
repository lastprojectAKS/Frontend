import { supabase } from "../../lib/supabaseClient";
import { addDays, dateRangeBetween } from "../lib/dateUtils";

// Same revenue rule used everywhere else in admin: only paid, still-confirmed
// bookings count toward revenue.
const isRevenueCountable = (b) => b.paymentStatus === "Paid" && b.bookingStatus === "Confirmed";

// Nothing here is a stored table — it's all derived from real bookings/
// showtimes/movies/cinemas/screens/profiles on demand, same as the mock this
// replaced. A short-lived cache avoids re-fetching the same tables 5-6 times
// when Dashboard/Reports call several of these functions in one Promise.all.
let cache = null;
let cachedAt = 0;
const CACHE_MS = 5000;

async function loadAll() {
  const now = Date.now();
  if (cache && now - cachedAt < CACHE_MS) return cache;

  const [
    { data: bookingRows, error: bError },
    { data: showtimeRows, error: sError },
    { data: movies, error: mError },
    { data: cinemas, error: cError },
    { data: screenRows, error: scError },
    { data: customers, error: cuError },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, booking_code, movie_id, cinema_id, screen_id, customer_id, show_date, start_time, amount, payment_status, booking_status, created_at, booking_seats(seat_label)"),
    supabase.from("showtimes").select("id, movie_id, cinema_id, screen_id, show_date, start_time, total_seats, booked_seats, status"),
    supabase.from("movies").select("id, title, poster, genres, status"),
    supabase.from("cinemas").select("id, name, status"),
    supabase.from("screens").select("id, cinema_id, name, type, status, screen_seat_categories(seat_count)"),
    supabase.from("profiles").select("id, name").eq("role", "customer"),
  ]);
  if (bError) throw bError;
  if (sError) throw sError;
  if (mError) throw mError;
  if (cError) throw cError;
  if (scError) throw scError;
  if (cuError) throw cuError;

  const bookings = bookingRows.map((b) => ({
    id: b.id,
    bookingCode: b.booking_code,
    movieId: b.movie_id,
    cinemaId: b.cinema_id,
    screenId: b.screen_id,
    customerId: b.customer_id,
    date: b.show_date,
    startTime: b.start_time?.slice(0, 5),
    seats: (b.booking_seats ?? []).map((s) => s.seat_label),
    amount: Number(b.amount),
    paymentStatus: b.payment_status,
    bookingStatus: b.booking_status,
    createdAt: b.created_at,
  }));

  const showtimes = showtimeRows.map((s) => ({
    id: s.id,
    movieId: s.movie_id,
    cinemaId: s.cinema_id,
    screenId: s.screen_id,
    date: s.show_date,
    startTime: s.start_time?.slice(0, 5),
    totalSeats: s.total_seats,
    bookedSeats: s.booked_seats,
    status: s.status,
  }));

  const screens = screenRows.map((s) => ({
    id: s.id,
    cinemaId: s.cinema_id,
    name: s.name,
    type: s.type,
    status: s.status,
    capacity: (s.screen_seat_categories ?? []).reduce((sum, c) => sum + c.seat_count, 0),
  }));

  cache = {
    bookings,
    showtimes,
    movies,
    cinemas,
    screens,
    customers,
    moviesById: new Map(movies.map((m) => [m.id, m])),
    cinemasById: new Map(cinemas.map((c) => [c.id, c])),
    screensById: new Map(screens.map((s) => [s.id, s])),
    customersById: new Map(customers.map((c) => [c.id, c])),
  };
  cachedAt = now;
  return cache;
}

function getDateRange(days) {
  const today = new Date().toISOString().slice(0, 10);
  return Array.from({ length: days }, (_, i) => addDays(today, -(days - 1 - i)));
}

function computeRevenueSeries(bookings, range) {
  const byDate = new Map(range.map((d) => [d, 0]));
  bookings.forEach((b) => {
    if (!isRevenueCountable(b)) return;
    const day = b.createdAt.slice(0, 10);
    if (byDate.has(day)) byDate.set(day, byDate.get(day) + b.amount);
  });
  return range.map((date) => ({ date, revenue: Math.round(byDate.get(date) * 100) / 100 }));
}

export async function getRevenueSeries(days = 30) {
  const { bookings } = await loadAll();
  return computeRevenueSeries(bookings, getDateRange(days));
}

export async function getRevenueSeriesForRange(startDate, endDate) {
  const { bookings } = await loadAll();
  return computeRevenueSeries(bookings, dateRangeBetween(startDate, endDate));
}

function computeStatusDistribution(bookings, startDate, endDate) {
  const counts = { Confirmed: 0, Pending: 0, Cancelled: 0, Refunded: 0 };
  bookings.forEach((b) => {
    const day = b.createdAt.slice(0, 10);
    if (startDate && (day < startDate || day > endDate)) return;
    counts[b.bookingStatus] = (counts[b.bookingStatus] || 0) + 1;
  });
  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}

export async function getBookingStatusDistribution() {
  const { bookings } = await loadAll();
  return computeStatusDistribution(bookings);
}

export async function getBookingStatusDistributionForRange(startDate, endDate) {
  const { bookings } = await loadAll();
  return computeStatusDistribution(bookings, startDate, endDate);
}

function computeMovieStats(movieId, bookings, showtimes) {
  const movieShowtimes = showtimes.filter((s) => s.movieId === movieId);
  const movieBookings = bookings.filter((b) => b.movieId === movieId);

  const ticketsSold = movieBookings.filter((b) => b.bookingStatus === "Confirmed").reduce((sum, b) => sum + b.seats.length, 0);
  const revenue = movieBookings.filter(isRevenueCountable).reduce((sum, b) => sum + b.amount, 0);
  const totalCapacity = movieShowtimes.reduce((sum, s) => sum + s.totalSeats, 0);
  const totalBooked = movieShowtimes.reduce((sum, s) => sum + s.bookedSeats, 0);

  return {
    ticketsSold,
    revenue: Math.round(revenue * 100) / 100,
    occupancy: totalCapacity > 0 ? totalBooked / totalCapacity : 0,
    showtimeCount: movieShowtimes.length,
  };
}

export async function getMovieStats(movieId) {
  const { bookings, showtimes } = await loadAll();
  return computeMovieStats(movieId, bookings, showtimes);
}

export async function getTopMovies(limit = 5) {
  const { bookings, showtimes, movies } = await loadAll();
  return movies
    .map((movie) => ({ movie, ...computeMovieStats(movie.id, bookings, showtimes) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

function computeCinemaStats(cinemaId, bookings, showtimes, screens) {
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

export async function getTopCinemas(limit = 5) {
  const { bookings, showtimes, cinemas, screens } = await loadAll();
  return cinemas
    .map((cinema) => ({ cinema, ...computeCinemaStats(cinema.id, bookings, showtimes, screens) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getTopCustomers(limit = 5) {
  const { bookings, customers } = await loadAll();
  return customers
    .map((customer) => {
      const customerBookings = bookings.filter((b) => b.customerId === customer.id);
      const totalSpent = customerBookings.filter(isRevenueCountable).reduce((sum, b) => sum + b.amount, 0);
      return { customer, totalBookings: customerBookings.length, totalSpent: Math.round(totalSpent * 100) / 100 };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

export async function getScreenOccupancy() {
  const { showtimes, screens, cinemasById } = await loadAll();
  return screens.map((screen) => {
    const screenShowtimes = showtimes.filter((s) => s.screenId === screen.id && s.status !== "Cancelled");
    const totalSlots = screenShowtimes.reduce((sum, s) => sum + s.totalSeats, 0);
    const totalBooked = screenShowtimes.reduce((sum, s) => sum + s.bookedSeats, 0);
    return {
      screen,
      cinema: cinemasById.get(screen.cinemaId),
      capacity: screen.capacity,
      occupancy: totalSlots > 0 ? totalBooked / totalSlots : 0,
    };
  });
}

export async function getDashboardSummary() {
  const { bookings, showtimes, movies } = await loadAll();
  const today = new Date().toISOString().slice(0, 10);

  const totalRevenue = bookings.filter(isRevenueCountable).reduce((sum, b) => sum + b.amount, 0);
  const todayBookings = bookings.filter((b) => b.createdAt.slice(0, 10) === today);
  const todayRevenue = todayBookings.filter(isRevenueCountable).reduce((sum, b) => sum + b.amount, 0);
  const upcomingShows = showtimes.filter((s) => s.date >= today && s.status === "Scheduled").length;

  const activeShowtimes = showtimes.filter((s) => s.status !== "Cancelled");
  const totalCapacity = activeShowtimes.reduce((sum, s) => sum + s.totalSeats, 0);
  const totalBooked = activeShowtimes.reduce((sum, s) => sum + s.bookedSeats, 0);

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalBookings: bookings.length,
    totalCustomers: new Set(bookings.map((b) => b.customerId)).size,
    activeMovies: movies.filter((m) => m.status === "Now Showing").length,
    todayRevenue: Math.round(todayRevenue * 100) / 100,
    todayBookings: todayBookings.length,
    upcomingShows,
    occupancyRate: totalCapacity > 0 ? totalBooked / totalCapacity : 0,
  };
}

export async function getRecentBookings(limit = 8) {
  const { bookings, moviesById, cinemasById, customersById } = await loadAll();
  return bookings
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map((b) => ({
      booking: { ...b, customer: customersById.get(b.customerId) },
      movie: moviesById.get(b.movieId),
      cinema: cinemasById.get(b.cinemaId),
    }));
}

export async function getUpcomingShows(limit = 8) {
  const { showtimes, moviesById, cinemasById, screensById } = await loadAll();
  const today = new Date().toISOString().slice(0, 10);
  return showtimes
    .filter((s) => s.date >= today && s.status === "Scheduled")
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .slice(0, limit)
    .map((s) => ({
      showtime: s,
      movie: moviesById.get(s.movieId),
      cinema: cinemasById.get(s.cinemaId),
      screen: screensById.get(s.screenId),
      occupancy: s.totalSeats > 0 ? s.bookedSeats / s.totalSeats : 0,
    }));
}
