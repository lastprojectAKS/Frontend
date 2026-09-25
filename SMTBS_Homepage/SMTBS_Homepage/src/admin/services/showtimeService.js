import { supabase } from "../../lib/supabaseClient";
import { getScreen } from "./cinemaService";
import {
  findShowtimeConflict,
  validateShowtimeTimes,
  canCreateShowtimeForMovie,
  canCreateShowtimeForScreen,
  canDeleteShowtime,
  isShowtimeInPast,
} from "../lib/businessRules";

export const SHOWTIME_STATUSES = ["Scheduled", "Completed", "Cancelled"];

// Postgres's own exclusion constraint (migration 0006's `exclude using gist`)
// is what actually makes an overlapping showtime impossible to insert — this
// code is just where a raw 23P01 gets translated into the same kind of
// message findShowtimeConflict's soft pre-check would have shown.
const EXCLUSION_VIOLATION = "23P01";

function mapRow(row) {
  return {
    id: row.id,
    movieId: row.movie_id,
    cinemaId: row.cinema_id,
    screenId: row.screen_id,
    date: row.show_date,
    startTime: row.start_time?.slice(0, 5),
    endTime: row.end_time?.slice(0, 5),
    price: Number(row.price),
    totalSeats: row.total_seats,
    bookedSeats: row.booked_seats,
    status: row.status,
    movie: row.movie ? { id: row.movie.id, title: row.movie.title, poster: row.movie.poster, status: row.movie.status, duration: row.movie.duration } : null,
    cinema: row.cinema ? { id: row.cinema.id, name: row.cinema.name, status: row.cinema.status } : null,
    screen: row.screen ? { id: row.screen.id, name: row.screen.name, type: row.screen.type, status: row.screen.status } : null,
  };
}

const SELECT_WITH_JOINS = "*, movie:movies(id,title,poster,status,duration), cinema:cinemas(id,name,status), screen:screens(id,name,type,status)";

export async function listShowtimes() {
  const { data, error } = await supabase.from("showtimes").select(SELECT_WITH_JOINS).order("show_date", { ascending: false }).order("start_time", { ascending: false });
  if (error) throw error;
  return data.map(mapRow);
}

export async function getShowtime(id) {
  const { data, error } = await supabase.from("showtimes").select(SELECT_WITH_JOINS).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Showtime "${id}" not found.`);
  return mapRow(data);
}

/**
 * Runs every creation-time business rule and returns the first violation
 * found, or null if the showtime is valid. Exported separately from
 * createShowtime so the form can validate on every field change (for the
 * conflict-warning UI) without actually writing anything yet. Async because
 * every check now queries real Supabase data.
 */
export async function validateShowtime({ movieId, cinemaId, screenId, date, startTime, endTime, excludeShowtimeId }) {
  const timeError = validateShowtimeTimes(startTime, endTime);
  if (timeError) return { field: "time", message: timeError };

  const [{ data: movie }, { data: cinema }] = await Promise.all([
    supabase.from("movies").select("*").eq("id", movieId).maybeSingle(),
    supabase.from("cinemas").select("*").eq("id", cinemaId).maybeSingle(),
  ]);
  if (!movie) return { field: "movie", message: "Select a movie." };
  const movieCheck = canCreateShowtimeForMovie(movie);
  if (!movieCheck.allowed) return { field: "movie", message: movieCheck.reason };

  let screen;
  try {
    screen = await getScreen(screenId);
  } catch {
    screen = null;
  }
  if (!cinema || !screen) return { field: "screen", message: "Select a cinema and screen." };
  const screenCheck = canCreateShowtimeForScreen(screen, cinema);
  if (!screenCheck.allowed) return { field: "screen", message: screenCheck.reason };

  if (!date) return { field: "date", message: "Select a date." };

  const conflict = await findShowtimeConflict({ screenId, date, startTime, endTime, excludeShowtimeId });
  if (conflict) {
    const { data: conflictMovie } = await supabase.from("movies").select("title").eq("id", conflict.movieId).maybeSingle();
    return {
      field: "conflict",
      message: `${screen.name} already has "${conflictMovie?.title}" scheduled from ${conflict.startTime} to ${conflict.endTime}.`,
      conflict,
    };
  }

  return null;
}

export async function createShowtime(data) {
  const error = await validateShowtime(data);
  if (error) throw Object.assign(new Error(error.message), { field: error.field });

  const screen = await getScreen(data.screenId);
  const { data: row, error: insertError } = await supabase
    .from("showtimes")
    .insert({
      movie_id: data.movieId,
      cinema_id: data.cinemaId,
      screen_id: data.screenId,
      show_date: data.date,
      start_time: data.startTime,
      end_time: data.endTime,
      price: data.price,
      total_seats: screen.capacity,
      booked_seats: 0,
      status: "Scheduled",
    })
    .select(SELECT_WITH_JOINS)
    .single();

  if (insertError) {
    if (insertError.code === EXCLUSION_VIOLATION) {
      throw new Error(`${screen.name} already has a showtime scheduled that overlaps with this time.`);
    }
    throw insertError;
  }
  return mapRow(row);
}

export async function updateShowtime(id, patch) {
  const existing = await getShowtime(id);

  if (isShowtimeInPast(existing) && patch.status !== "Cancelled") {
    throw new Error("Past showtimes can't be edited like upcoming ones — only cancellation is allowed.");
  }

  const merged = { ...existing, ...patch };
  const error = await validateShowtime({ ...merged, excludeShowtimeId: id });
  if (error) throw Object.assign(new Error(error.message), { field: error.field });

  const rowPatch = {
    movie_id: merged.movieId,
    cinema_id: merged.cinemaId,
    screen_id: merged.screenId,
    show_date: merged.date,
    start_time: merged.startTime,
    end_time: merged.endTime,
    price: merged.price,
  };
  // Only recompute total_seats when the screen actually changed — editing a
  // showtime's screen shouldn't leave total_seats pointing at the old one.
  if (patch.screenId && patch.screenId !== existing.screenId) {
    const screen = await getScreen(patch.screenId);
    rowPatch.total_seats = screen.capacity;
  }

  const { data: row, error: updateError } = await supabase.from("showtimes").update(rowPatch).eq("id", id).select(SELECT_WITH_JOINS).maybeSingle();
  if (updateError) {
    if (updateError.code === EXCLUSION_VIOLATION) {
      throw new Error("This screen already has a showtime scheduled that overlaps with this time.");
    }
    throw updateError;
  }
  if (!row) throw new Error(`Showtime "${id}" not found.`);
  return mapRow(row);
}

export async function cancelShowtime(id) {
  const { data: row, error } = await supabase.from("showtimes").update({ status: "Cancelled" }).eq("id", id).select(SELECT_WITH_JOINS).maybeSingle();
  if (error) throw error;
  if (!row) throw new Error(`Showtime "${id}" not found.`);
  return mapRow(row);
}

export async function deleteShowtime(id) {
  const { allowed, reason } = await canDeleteShowtime(id);
  if (!allowed) throw new Error(reason);

  const { error } = await supabase.from("showtimes").delete().eq("id", id);
  if (error) throw error;
}
