import { supabase } from "../../lib/supabaseClient";

// Real check constraint on screens.type (supabase/migrations/0006). Defined
// here rather than imported from ../data/screens, same reasoning as
// MOVIE_STATUSES in movieService.js — that file is admin's mock catalog for
// resources that haven't migrated yet (Showtimes/Bookings/Customers/Reports
// still enrich against it); Cinemas/Screens no longer touch it.
export const SCREEN_TYPES = ["Standard", "Premium", "IMAX"];

function mapCinemaRow(row, screenCount) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    distance: row.distance,
    phone: row.phone,
    email: row.email,
    amenities: row.amenities ?? [],
    status: row.status,
    screenCount,
  };
}

// Partial by design (only maps keys present in `data`) — createCinema sends
// a full payload, updateCinema/status toggles send a partial patch, and this
// must never blow away amenities/movie_ids on a status-only update.
function mapCinemaToRow(data) {
  const row = {};
  if ("name" in data) row.name = data.name;
  if ("address" in data) row.address = data.address;
  if ("distance" in data) row.distance = data.distance;
  if ("phone" in data) row.phone = data.phone;
  if ("email" in data) row.email = data.email;
  if ("amenities" in data) row.amenities = data.amenities;
  if ("status" in data) row.status = data.status;
  return row;
}

function mapScreenRow(row, categories) {
  return {
    id: row.id,
    cinemaId: row.cinema_id,
    name: row.name,
    type: row.type,
    status: row.status,
    seatCategories: categories.map((c) => ({
      name: c.category,
      count: c.seat_count,
      priceMultiplier: Number(c.price_multiplier),
    })),
    // Attached directly (not left for callers to compute) — Cinemas.jsx's
    // ScreenCard reads screen.capacity straight off the object, same as the
    // old mock service always attached it.
    capacity: categories.reduce((sum, c) => sum + c.seat_count, 0),
  };
}

export function getScreenCapacity(screen) {
  return screen.seatCategories.reduce((sum, c) => sum + c.count, 0);
}

async function categoriesForScreens(screenIds) {
  if (screenIds.length === 0) return new Map();
  const { data, error } = await supabase.from("screen_seat_categories").select("*").in("screen_id", screenIds);
  if (error) throw error;
  const byScreen = new Map();
  for (const row of data) {
    if (!byScreen.has(row.screen_id)) byScreen.set(row.screen_id, []);
    byScreen.get(row.screen_id).push(row);
  }
  return byScreen;
}

export async function listCinemas() {
  const [{ data: cinemas, error: cError }, { data: screens, error: sError }] = await Promise.all([
    supabase.from("cinemas").select("*").order("name"),
    supabase.from("screens").select("id, cinema_id"),
  ]);
  if (cError) throw cError;
  if (sError) throw sError;

  const countByCinema = new Map();
  for (const s of screens) countByCinema.set(s.cinema_id, (countByCinema.get(s.cinema_id) ?? 0) + 1);

  return cinemas.map((row) => mapCinemaRow(row, countByCinema.get(row.id) ?? 0));
}

export async function getCinema(id) {
  const { data: row, error } = await supabase.from("cinemas").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!row) throw new Error(`Cinema "${id}" not found.`);

  const screens = await listScreens(id);
  return { ...mapCinemaRow(row, screens.length), screens };
}

export async function createCinema(data) {
  const id =
    data.id ||
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const { data: row, error } = await supabase
    .from("cinemas")
    .insert({ ...mapCinemaToRow(data), id, status: data.status || "Active" })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("A cinema with this name already exists.");
    throw error;
  }
  return mapCinemaRow(row, 0);
}

export async function updateCinema(id, patch) {
  let warning;
  if (patch.status === "Inactive") {
    const check = await canDeactivateCinema(id);
    warning = check.warning;
  }

  const { data: row, error } = await supabase.from("cinemas").update(mapCinemaToRow(patch)).eq("id", id).select().maybeSingle();
  if (error) throw error;
  if (!row) throw new Error(`Cinema "${id}" not found.`);

  const screens = await listScreens(id);
  return { ...mapCinemaRow(row, screens.length), __warning: warning };
}

export async function listScreens(cinemaId) {
  const { data: rows, error } = await supabase.from("screens").select("*").eq("cinema_id", cinemaId).order("name");
  if (error) throw error;
  const categoriesByScreen = await categoriesForScreens(rows.map((r) => r.id));
  return rows.map((row) => mapScreenRow(row, categoriesByScreen.get(row.id) ?? []));
}

export async function getScreen(id) {
  const { data: row, error } = await supabase.from("screens").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!row) throw new Error(`Screen "${id}" not found.`);
  const categoriesByScreen = await categoriesForScreens([id]);
  return mapScreenRow(row, categoriesByScreen.get(id) ?? []);
}

async function replaceSeatCategories(screenId, seatCategories) {
  const { error: delError } = await supabase.from("screen_seat_categories").delete().eq("screen_id", screenId);
  if (delError) throw delError;
  if (seatCategories.length === 0) return;

  const { error: insError } = await supabase.from("screen_seat_categories").insert(
    seatCategories.map((c) => ({
      screen_id: screenId,
      category: c.name,
      seat_count: c.count,
      price_multiplier: c.priceMultiplier,
    }))
  );
  if (insError) throw insError;
}

export async function createScreen(data) {
  const { count, error: countError } = await supabase
    .from("screens")
    .select("id", { count: "exact", head: true })
    .eq("cinema_id", data.cinemaId);
  if (countError) throw countError;
  const id = data.id || `${data.cinemaId}-${(count ?? 0) + 1}`;

  const { data: row, error } = await supabase
    .from("screens")
    .insert({ id, cinema_id: data.cinemaId, name: data.name, type: data.type, status: data.status || "Active" })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("A screen with this id already exists.");
    throw error;
  }

  await replaceSeatCategories(id, data.seatCategories ?? []);
  return getScreen(id);
}

export async function updateScreen(id, patch) {
  if (patch.seatCategories) {
    const newCapacity = patch.seatCategories.reduce((sum, c) => sum + c.count, 0);
    const { allowed, reason } = await canReduceScreenCapacity(id, newCapacity);
    if (!allowed) throw new Error(reason);
  }

  const rowPatch = {};
  if ("name" in patch) rowPatch.name = patch.name;
  if ("type" in patch) rowPatch.type = patch.type;
  if ("status" in patch) rowPatch.status = patch.status;

  if (Object.keys(rowPatch).length > 0) {
    const { error } = await supabase.from("screens").update(rowPatch).eq("id", id);
    if (error) throw error;
  }

  if (patch.seatCategories) {
    await replaceSeatCategories(id, patch.seatCategories);
  }

  return getScreen(id);
}

// Kept here (not in businessRules.js) to avoid a circular import between
// cinemaService and businessRules now that both need Supabase — same
// resolution used for canDeleteMovie's relationship to movieService.
export async function canReduceScreenCapacity(screenId, newCapacity) {
  const { data, error } = await supabase
    .from("showtimes")
    .select("booked_seats")
    .eq("screen_id", screenId)
    .neq("status", "Cancelled")
    .order("booked_seats", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  const maxBooked = data?.booked_seats ?? 0;
  return {
    allowed: newCapacity >= maxBooked,
    reason: newCapacity >= maxBooked ? null : `This screen has a showtime with ${maxBooked} seats already booked. Capacity can't drop below that.`,
  };
}

export async function canDeactivateCinema(cinemaId) {
  const today = new Date().toISOString().slice(0, 10);
  const { count, error } = await supabase
    .from("showtimes")
    .select("id", { count: "exact", head: true })
    .eq("cinema_id", cinemaId)
    .gte("show_date", today)
    .eq("status", "Scheduled");
  if (error) throw error;

  const upcoming = (count ?? 0) > 0;
  return {
    allowed: true,
    warning: upcoming
      ? "This cinema has upcoming scheduled showtimes. Deactivating it will hide it from customers, but existing showtimes and bookings are preserved."
      : null,
  };
}
