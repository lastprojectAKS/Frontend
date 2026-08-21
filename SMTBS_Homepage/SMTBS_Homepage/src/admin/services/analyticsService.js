import { delay } from "../lib/asyncDelay";
import * as analytics from "../data/analytics";

export async function getDashboardSummary() {
  await delay();
  return analytics.getDashboardSummary();
}

export async function getRevenueSeries(days) {
  await delay();
  return analytics.getRevenueSeries(days);
}

export async function getBookingsSeries(days) {
  await delay();
  return analytics.getBookingsSeries(days);
}

export async function getBookingStatusDistribution() {
  await delay();
  return analytics.getBookingStatusDistribution();
}

export async function getTopMovies(limit) {
  await delay();
  return analytics.getTopMovies(limit);
}

export async function getMovieStats(movieId) {
  await delay();
  return analytics.getMovieStats(movieId);
}

export async function getRevenueSeriesForRange(startDate, endDate) {
  await delay();
  return analytics.getRevenueSeriesForRange(startDate, endDate);
}

export async function getBookingsSeriesForRange(startDate, endDate) {
  await delay();
  return analytics.getBookingsSeriesForRange(startDate, endDate);
}

export async function getBookingStatusDistributionForRange(startDate, endDate) {
  await delay();
  return analytics.getBookingStatusDistributionForRange(startDate, endDate);
}

export async function getTopCustomers(limit) {
  await delay();
  return analytics.getTopCustomers(limit);
}

export async function getTopCinemas(limit) {
  await delay();
  return analytics.getTopCinemas(limit);
}

export async function getScreenOccupancy() {
  await delay();
  return analytics.getScreenOccupancy();
}

export async function getRecentBookings(limit) {
  await delay();
  return analytics.getRecentBookings(limit);
}

export async function getUpcomingShows(limit) {
  await delay();
  return analytics.getUpcomingShows(limit);
}
