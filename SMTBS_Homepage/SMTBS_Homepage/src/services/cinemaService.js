import { supabase } from "../lib/supabaseClient";

// movie_ids is a denormalized placeholder until a real showtimes table
// exists (Phase 2b) — there's no join to derive "what's playing where" yet.
//
// movieTitles is resolved against the real `movies` table below (not local
// mock data — a cinema's movie_ids are real ids from the live catalog, so
// resolving them against anything else silently breaks the moment the
// catalog changes) and attached per row before mapCinema runs.
function mapCinema(row, titleById) {
  return {
    id: row.id,
    name: row.name,
    location: row.address,
    distance: row.distance,
    amenities: row.amenities,
    movieIds: row.movie_ids,
    movieTitles: row.movie_ids.map((movieId) => titleById.get(movieId)).filter(Boolean),
  };
}

async function titlesFor(rows) {
  const ids = [...new Set(rows.flatMap((row) => row.movie_ids))];
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase.from("movies").select("id, title").in("id", ids);
  if (error) throw error;
  return new Map(data.map((movie) => [movie.id, movie.title]));
}

export async function listCinemas() {
  const { data, error } = await supabase.from("cinemas").select("*").eq("status", "Active").order("name");
  if (error) throw error;
  const titleById = await titlesFor(data);
  return data.map((row) => mapCinema(row, titleById));
}

export async function getCinema(id) {
  const { data, error } = await supabase.from("cinemas").select("*").eq("id", id).eq("status", "Active").maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const titleById = await titlesFor([data]);
  return mapCinema(data, titleById);
}

export async function getMovieIdsShowingAtCinema(cinemaId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("showtimes")
    .select("movie_id")
    .eq("cinema_id", cinemaId)
    .eq("status", "Scheduled")
    .gte("show_date", today);
  if (error) throw error;
  return [...new Set(data.map((row) => row.movie_id))];
}

// A cinema shows a movie when it has upcoming scheduled showtimes for it, so
// the list always matches what can actually be booked.
export async function getCinemasForMovie(movieId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: showtimes, error: showtimeError } = await supabase
    .from("showtimes")
    .select("cinema_id")
    .eq("movie_id", movieId)
    .eq("status", "Scheduled")
    .gte("show_date", today);
  if (showtimeError) throw showtimeError;

  const cinemaIds = [...new Set(showtimes.map((row) => row.cinema_id))];
  if (cinemaIds.length === 0) return [];

  const { data, error } = await supabase.from("cinemas").select("*").eq("status", "Active").in("id", cinemaIds).order("name");
  if (error) throw error;
  const titleById = await titlesFor(data);
  return data.map((row) => mapCinema(row, titleById));
}
