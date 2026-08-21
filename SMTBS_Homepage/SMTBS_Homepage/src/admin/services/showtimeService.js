import { delay } from "../lib/asyncDelay";
import { showtimes, getShowtimeById, SHOWTIME_STATUSES } from "../data/showtimes";
import { getMovieById } from "../data/movies";
import { getCinemaById } from "../data/cinemas";
import { getScreenById, getScreenCapacity } from "../data/screens";
import {
  findShowtimeConflict,
  validateShowtimeTimes,
  canCreateShowtimeForMovie,
  canCreateShowtimeForScreen,
  canDeleteShowtime,
  isShowtimeInPast,
} from "../lib/businessRules";

export { SHOWTIME_STATUSES };

function enrich(showtime) {
  return {
    ...showtime,
    movie: getMovieById(showtime.movieId),
    cinema: getCinemaById(showtime.cinemaId),
    screen: getScreenById(showtime.screenId),
  };
}

export async function listShowtimes() {
  await delay();
  return showtimes.map(enrich);
}

export async function getShowtime(id) {
  await delay();
  const showtime = getShowtimeById(id);
  if (!showtime) throw new Error(`Showtime "${id}" not found.`);
  return enrich(showtime);
}

/**
 * Runs every creation-time business rule and returns the first violation
 * found, or null if the showtime is valid. Exported separately from
 * createShowtime so the form can validate on every field change (for the
 * conflict-warning UI) without actually writing anything yet.
 */
export function validateShowtime({ movieId, cinemaId, screenId, date, startTime, endTime, excludeShowtimeId }) {
  const timeError = validateShowtimeTimes(startTime, endTime);
  if (timeError) return { field: "time", message: timeError };

  const movie = getMovieById(movieId);
  if (!movie) return { field: "movie", message: "Select a movie." };
  const movieCheck = canCreateShowtimeForMovie(movie);
  if (!movieCheck.allowed) return { field: "movie", message: movieCheck.reason };

  const cinema = getCinemaById(cinemaId);
  const screen = getScreenById(screenId);
  if (!cinema || !screen) return { field: "screen", message: "Select a cinema and screen." };
  const screenCheck = canCreateShowtimeForScreen(screen, cinema);
  if (!screenCheck.allowed) return { field: "screen", message: screenCheck.reason };

  if (!date) return { field: "date", message: "Select a date." };

  const conflict = findShowtimeConflict({ screenId, date, startTime, endTime, excludeShowtimeId });
  if (conflict) {
    const conflictMovie = getMovieById(conflict.movieId);
    return {
      field: "conflict",
      message: `${screen.name} already has "${conflictMovie?.title}" scheduled from ${conflict.startTime} to ${conflict.endTime}.`,
      conflict,
    };
  }

  return null;
}

export async function createShowtime(data) {
  await delay();
  const error = validateShowtime(data);
  if (error) throw Object.assign(new Error(error.message), { field: error.field });

  const screen = getScreenById(data.screenId);
  const showtime = {
    id: `st-${String(showtimes.length + 1).padStart(4, "0")}-${Date.now().toString(36)}`,
    movieId: data.movieId,
    cinemaId: data.cinemaId,
    screenId: data.screenId,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    price: data.price,
    totalSeats: getScreenCapacity(screen),
    bookedSeats: 0,
    status: "Scheduled",
  };

  showtimes.push(showtime);
  return enrich(showtime);
}

export async function updateShowtime(id, patch) {
  await delay();
  const existing = getShowtimeById(id);
  if (!existing) throw new Error(`Showtime "${id}" not found.`);

  if (isShowtimeInPast(existing) && patch.status !== "Cancelled") {
    throw new Error("Past showtimes can't be edited like upcoming ones — only cancellation is allowed.");
  }

  const merged = { ...existing, ...patch };
  const error = validateShowtime({ ...merged, excludeShowtimeId: id });
  if (error) throw Object.assign(new Error(error.message), { field: error.field });

  const index = showtimes.findIndex((s) => s.id === id);
  showtimes[index] = merged;
  return enrich(merged);
}

export async function cancelShowtime(id) {
  await delay();
  const index = showtimes.findIndex((s) => s.id === id);
  if (index === -1) throw new Error(`Showtime "${id}" not found.`);
  showtimes[index] = { ...showtimes[index], status: "Cancelled" };
  return enrich(showtimes[index]);
}

export async function deleteShowtime(id) {
  await delay();
  const { allowed, reason } = canDeleteShowtime(id);
  if (!allowed) throw new Error(reason);

  const index = showtimes.findIndex((s) => s.id === id);
  if (index === -1) throw new Error(`Showtime "${id}" not found.`);
  showtimes.splice(index, 1);
}
