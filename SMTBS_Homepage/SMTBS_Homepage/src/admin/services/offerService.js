import { supabase } from "../../lib/supabaseClient";

const OFFER_FIELDS = [
  "title",
  "description",
  "code",
  "discount",
  "validity",
  "discount_type",
  "discount_value",
  "days_of_week",
  "valid_from",
  "valid_until",
  "active",
];

const DAY_NAMES = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun" };

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pickFields(data) {
  const row = {};
  for (const key of OFFER_FIELDS) {
    if (key in data) row[key] = data[key];
  }
  return row;
}

function dayRangeLabel(days) {
  // Monday-first ordering so Fri–Sun reads as one run instead of wrapping.
  const order = days.map((d) => (d === 0 ? 7 : d)).sort((a, b) => a - b);
  const runs = [];
  let start = order[0];
  let prev = order[0];
  for (const d of order.slice(1)) {
    if (d === prev + 1) {
      prev = d;
    } else {
      runs.push([start, prev]);
      start = d;
      prev = d;
    }
  }
  runs.push([start, prev]);
  return runs.map(([a, b]) => (a === b ? DAY_NAMES[a] : `${DAY_NAMES[a]}–${DAY_NAMES[b]}`)).join(", ");
}

function formatIsoDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Customer-facing discount/validity text is derived from the structured fields
// so the two can never disagree about what the code actually does.
export function buildOfferDisplay({ discount_type, discount_value, days_of_week, valid_from, valid_until }) {
  const amount = Number(discount_value);
  const discount = discount_type === "percent" ? `${amount}% OFF` : `Save $${amount}`;

  const parts = [days_of_week?.length ? dayRangeLabel(days_of_week) : "Every day"];
  if (valid_from && valid_until) parts.push(`${formatIsoDate(valid_from)} – ${formatIsoDate(valid_until)}`);
  else if (valid_from) parts.push(`from ${formatIsoDate(valid_from)}`);
  else if (valid_until) parts.push(`until ${formatIsoDate(valid_until)}`);

  return { discount, validity: parts.join(", ") };
}

export async function listOffers() {
  const { data, error } = await supabase.from("offers").select("*").order("title");
  if (error) throw error;
  return data;
}

export async function createOffer(data) {
  const row = { ...pickFields(data), id: data.id || slugify(data.title) };
  const { data: created, error } = await supabase.from("offers").insert(row).select().single();
  if (error) {
    if (error.code === "23505") throw new Error("An offer with this title or code already exists.");
    throw error;
  }
  return created;
}

export async function updateOffer(id, patch) {
  const { data, error } = await supabase.from("offers").update(pickFields(patch)).eq("id", id).select().maybeSingle();
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
