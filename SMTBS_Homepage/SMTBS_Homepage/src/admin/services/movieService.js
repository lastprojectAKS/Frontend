import { supabase } from "../../lib/supabaseClient";
import { canDeleteMovie } from "../lib/businessRules";

// Real check constraint on movies.status (supabase/migrations/0005) — kept
// here (not imported from ../data/movies) since that file is admin's mock
// catalog for the resources that haven't migrated yet (Showtimes, Bookings,
// Customers, Reports all still enrich against it); Movies itself no longer
// touches it.
export const MOVIE_STATUSES = ["Draft", "Upcoming", "Now Showing", "Ended", "Inactive"];

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// cast_members is jsonb ({name, role} objects) on the real table — mapped
// straight through, no join needed like the customer-side service does for
// cinema movie titles.
function mapRow(row) {
  return {
    id: row.id,
    title: row.title,
    poster: row.poster,
    backdrop: row.backdrop,
    genres: row.genres ?? [],
    duration: row.duration,
    language: row.language,
    ageRating: row.age_rating,
    director: row.director,
    cast: row.cast_members ?? [],
    releaseDate: row.release_date,
    endDate: row.end_date,
    trailerUrl: row.trailer_url,
    status: row.status,
    rating: row.rating === null ? 0 : Number(row.rating),
    description: row.description,
  };
}

// Partial by design (only maps keys present in `data`) so the same function
// serves both createMovie's full payload and setMovieStatus's {status}-only
// patch, matching the old mock's `{ ...existing, ...patch }` semantics.
function mapToRow(data) {
  const row = {};
  if ("title" in data) row.title = data.title;
  if ("poster" in data) row.poster = data.poster;
  if ("backdrop" in data) row.backdrop = data.backdrop;
  if ("genres" in data) row.genres = data.genres;
  if ("duration" in data) row.duration = data.duration;
  if ("language" in data) row.language = data.language;
  if ("ageRating" in data) row.age_rating = data.ageRating;
  if ("director" in data) row.director = data.director;
  if ("cast" in data) row.cast_members = data.cast;
  if ("releaseDate" in data) row.release_date = data.releaseDate;
  if ("endDate" in data) row.end_date = data.endDate;
  if ("trailerUrl" in data) row.trailer_url = data.trailerUrl;
  if ("status" in data) row.status = data.status;
  if ("rating" in data) row.rating = data.rating;
  if ("description" in data) row.description = data.description;
  return row;
}

export async function listMovies() {
  const { data, error } = await supabase.from("movies").select("*").order("title");
  if (error) throw error;
  return data.map(mapRow);
}

export async function getMovie(id) {
  const { data, error } = await supabase.from("movies").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Movie "${id}" not found.`);
  return mapRow(data);
}

export async function createMovie(data) {
  const id = data.id || slugify(data.title);
  const { data: row, error } = await supabase
    .from("movies")
    .insert({ ...mapToRow(data), id })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("A movie with this title already exists.");
    throw error;
  }
  return mapRow(row);
}

export async function updateMovie(id, patch) {
  const { data: row, error } = await supabase.from("movies").update(mapToRow(patch)).eq("id", id).select().maybeSingle();
  if (error) throw error;
  if (!row) throw new Error(`Movie "${id}" not found.`);
  return mapRow(row);
}

export async function deleteMovie(id) {
  const { allowed, reason } = await canDeleteMovie(id);
  if (!allowed) throw new Error(reason);

  const { error } = await supabase.from("movies").delete().eq("id", id);
  if (error) throw error;
}

export async function setMovieStatus(id, status) {
  return updateMovie(id, { status });
}
