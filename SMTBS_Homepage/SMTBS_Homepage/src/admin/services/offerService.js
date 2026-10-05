import { supabase } from "../../lib/supabaseClient";

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function listOffers() {
  const { data, error } = await supabase.from("offers").select("*").order("title");
  if (error) throw error;
  return data;
}

export async function createOffer(data) {
  const id = data.id || slugify(data.title);
  const { data: row, error } = await supabase
    .from("offers")
    .insert({
      id,
      title: data.title,
      description: data.description,
      discount: data.discount,
      validity: data.validity,
      code: data.code,
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("An offer with this title or code already exists.");
    throw error;
  }
  return row;
}

export async function updateOffer(id, patch) {
  const row = {};
  if ("title" in patch) row.title = patch.title;
  if ("description" in patch) row.description = patch.description;
  if ("discount" in patch) row.discount = patch.discount;
  if ("validity" in patch) row.validity = patch.validity;
  if ("code" in patch) row.code = patch.code;

  const { data, error } = await supabase.from("offers").update(row).eq("id", id).select().maybeSingle();
  if (error) {
    if (error.code === "23505") throw new Error("An offer with this code already exists.");
    throw error;
  }
  if (!data) throw new Error(`Offer "${id}" not found.`);
  return data;
}

export async function deleteOffer(id) {
  const { error } = await supabase.from("offers").delete().eq("id", id);
  if (error) throw error;
}
