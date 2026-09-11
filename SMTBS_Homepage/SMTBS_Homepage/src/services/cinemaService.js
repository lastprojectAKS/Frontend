import { supabase } from "../lib/supabaseClient";

// movie_ids is a denormalized placeholder until a real showtimes table
// exists (Phase 2b) — there's no join to derive "what's playing where" yet.
function mapCinema(row) {
  return {
    id: row.id,
    name: row.name,
    location: row.address,
    distance: row.distance,
    amenities: row.amenities,
    movieIds: row.movie_ids,
  };
}

export async function listCinemas() {
  const { data, error } = await supabase.from("cinemas").select("*").eq("status", "Active").order("name");
  if (error) throw error;
  return data.map(mapCinema);
}

export async function getCinema(id) {
  const { data, error } = await supabase.from("cinemas").select("*").eq("id", id).eq("status", "Active").maybeSingle();
  if (error) throw error;
  return data ? mapCinema(data) : null;
}

export async function getCinemasForMovie(movieId) {
  const { data, error } = await supabase.from("cinemas").select("*").eq("status", "Active").contains("movie_ids", [movieId]);
  if (error) throw error;
  return data.map(mapCinema);
}
