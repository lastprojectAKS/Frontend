import { delay } from "../lib/asyncDelay";
import { customers, getCustomerById } from "../data/customers";
import { isRevenueCountable, getBookingsForCustomer } from "../data/bookings";
import { getMovieById } from "../data/movies";
import { getCinemaById } from "../data/cinemas";

function computeStats(customerId) {
  const customerBookings = getBookingsForCustomer(customerId);
  const totalSpent = customerBookings.filter(isRevenueCountable).reduce((sum, b) => sum + b.amount, 0);
  const lastBooking = customerBookings
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  const genreCounts = new Map();
  customerBookings.forEach((b) => {
    const movie = getMovieById(b.movieId);
    movie?.genres.forEach((g) => genreCounts.set(g, (genreCounts.get(g) || 0) + 1));
  });
  const favouriteGenres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);

  return {
    totalBookings: customerBookings.length,
    totalSpent: Math.round(totalSpent * 100) / 100,
    lastBookingDate: lastBooking?.createdAt ?? null,
    favouriteGenres,
  };
}

export async function listCustomers() {
  await delay();
  return customers.map((c) => ({ ...c, ...computeStats(c.id) }));
}

export async function getCustomer(id) {
  await delay();
  const customer = getCustomerById(id);
  if (!customer) throw new Error(`Customer "${id}" not found.`);

  const history = getBookingsForCustomer(id)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((b) => ({ ...b, movie: getMovieById(b.movieId), cinema: getCinemaById(b.cinemaId) }));

  return { ...customer, ...computeStats(id), history };
}

export async function setCustomerStatus(id, status) {
  await delay();
  const index = customers.findIndex((c) => c.id === id);
  if (index === -1) throw new Error(`Customer "${id}" not found.`);
  customers[index] = { ...customers[index], status };
  return { ...customers[index], ...computeStats(id) };
}
