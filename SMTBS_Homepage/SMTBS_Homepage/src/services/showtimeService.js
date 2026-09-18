import { supabase } from "../lib/supabaseClient";

// Kept in 12-hour "10:30 AM" form on the way out, matching the shape the
// booking flow's downstream pages (seat selection, checkout) already
// expect — nothing past Booking.jsx needs to change for this.
function formatTime12h(time24) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function dayOption(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return {
    iso: dateStr,
    label: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    dayNumber: d.getUTCDate(),
    month: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
  };
}

// `show_date` is a plain date column (no timezone) and dayOption() above
// already anchors it at UTC midnight for display, so "today" is computed
// the same way here for consistency.
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export async function getShowtimeDates(movieId, cinemaId) {
  const { data, error } = await supabase
    .from("showtimes")
    .select("show_date")
    .eq("movie_id", movieId)
    .eq("cinema_id", cinemaId)
    .eq("status", "Scheduled")
    .gte("show_date", todayIso())
    .order("show_date");
  if (error) throw error;
  return [...new Set(data.map((row) => row.show_date))].map(dayOption);
}

export async function getShowtimesForDate(movieId, cinemaId, date) {
  const { data, error } = await supabase
    .from("showtimes")
    .select("id, screen_id, start_time, total_seats, booked_seats")
    .eq("movie_id", movieId)
    .eq("cinema_id", cinemaId)
    .eq("show_date", date)
    .eq("status", "Scheduled")
    .order("start_time");
  if (error) throw error;

  // For today, drop slots that have already started — a "10:00 AM" showing
  // shouldn't still be bookable at 3 PM. Every other date is unaffected.
  const now = new Date();
  const isToday = date === todayIso();
  const nowHms = now.toISOString().slice(11, 19);

  return data
    .filter((row) => !isToday || row.start_time > nowHms)
    .map((row) => {
      const occupancy = row.total_seats > 0 ? row.booked_seats / row.total_seats : 0;
      return {
        id: row.id,
        screenId: row.screen_id,
        time: formatTime12h(row.start_time.slice(0, 5)),
        status: occupancy >= 1 ? "sold-out" : occupancy >= 0.75 ? "few-seats" : "available",
      };
    });
}
