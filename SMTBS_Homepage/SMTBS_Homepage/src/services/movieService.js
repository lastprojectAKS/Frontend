import { supabase } from "../lib/supabaseClient";

// Only these two statuses are ever shown to customers — Draft/Ended/Inactive
// exist for admin's lifecycle but were never meant to be publicly bookable.
const VISIBLE_STATUSES = ["Now Showing", "Upcoming"];

export function mapMovie(row) {
  return {
    id: row.id,
    title: row.title,
    poster: row.poster,
    backdrop: row.backdrop,
    genres: row.genres,
    duration: row.duration,
    language: row.language,
    ageRating: row.age_rating,
    director: row.director,
    cast: row.cast_members,
    releaseDate: row.release_date,
    endDate: row.end_date,
    trailerUrl: row.trailer_url,
    status: row.status,
    rating: row.rating,
    description: row.description,
  };
}

export const isNowShowing = (movie) => movie.status === "Now Showing";
export const isComingSoon = (movie) => movie.status === "Upcoming";

export async function listMovies() {
  const { data, error } = await supabase.from("movies").select("*").in("status", VISIBLE_STATUSES).order("title");
  if (error) throw error;
  return data.map(mapMovie);
}

export async function getMovie(id) {
  const { data, error } = await supabase.from("movies").select("*").eq("id", id).in("status", VISIBLE_STATUSES).maybeSingle();
  if (error) throw error;
  return data ? mapMovie(data) : null;
}
