import { supabase } from "../lib/supabaseClient";
import { mapMovie } from "./movieService";

export async function listFavouriteMovieIds() {
  const { data, error } = await supabase.from("favourites").select("movie_id");
  if (error) throw error;
  return data.map((r) => r.movie_id);
}

export async function listFavouriteMovies() {
  const { data, error } = await supabase.from("favourites").select("movie:movies(*)").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((r) => r.movie).filter(Boolean).map(mapMovie);
}

export async function addFavourite(movieId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to save favourites.");
  const { error } = await supabase.from("favourites").insert({ customer_id: user.id, movie_id: movieId });
  if (error) throw error;
}

export async function removeFavourite(movieId) {
  const { error } = await supabase.from("favourites").delete().eq("movie_id", movieId);
  if (error) throw error;
}
