import { supabase } from "../lib/supabaseClient";

export async function listOffers() {
  const { data, error } = await supabase.from("offers").select("*").order("title");
  if (error) throw error;
  return data;
}
