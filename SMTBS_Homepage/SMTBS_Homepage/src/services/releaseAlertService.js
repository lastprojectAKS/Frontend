import { supabase } from "../lib/supabaseClient";

export async function hasReleaseAlert(userId, movieId) {
  const { data, error } = await supabase
    .from("release_alerts")
    .select("movie_id")
    .eq("user_id", userId)
    .eq("movie_id", movieId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function setReleaseAlert(userId, movieId, enabled) {
  if (enabled) {
    const { error } = await supabase.from("release_alerts").upsert({ user_id: userId, movie_id: movieId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("release_alerts").delete().eq("user_id", userId).eq("movie_id", movieId);
    if (error) throw error;
  }
}
