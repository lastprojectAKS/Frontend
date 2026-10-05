import { supabase } from "../lib/supabaseClient";

const SEATS_PER_ROW = 10;
const ROW_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CATEGORY_ORDER = ["Standard", "Premium", "VIP"];

// Mirrors resolve_seat_category() in the database exactly — Standard rows
// first, then Premium, then VIP, 10 seats per row, last row of a category
// may be a partial row. Kept in lockstep with the SQL version deliberately:
// this one drives what's rendered, the SQL one is the authority on price.
function buildSeatLayout(categories) {
  const ordered = CATEGORY_ORDER.map((name) => categories.find((c) => c.category === name)).filter(Boolean);
  const rows = [];
  let rowIndex = 0;
  for (const cat of ordered) {
    let remaining = cat.seat_count;
    while (remaining > 0) {
      const rowLetter = ROW_LETTERS[rowIndex];
      const seatsInRow = Math.min(SEATS_PER_ROW, remaining);
      rows.push({ row: rowLetter, category: cat.category, priceMultiplier: Number(cat.price_multiplier), count: seatsInRow });
      remaining -= seatsInRow;
      rowIndex += 1;
    }
  }
  return rows;
}

// Seats that are booked, or held by another customer at checkout.
export async function getOccupiedSeats(showtimeId) {
  const { data, error } = await supabase.rpc("get_seat_occupancy", { p_showtime_id: showtimeId });
  if (error) throw error;
  return new Set(data.map((r) => r.seat_label));
}

// Reserves the given seats for the signed-in customer for 10 minutes. Throws
// with the database's message if a seat was booked or is held by someone else.
export async function holdSeats(showtimeId, seatLabels) {
  const { error } = await supabase.rpc("hold_seats", { p_showtime_id: showtimeId, p_seat_labels: seatLabels });
  if (error) throw new Error(error.message);
}

export async function releaseSeatHolds(showtimeId) {
  const { error } = await supabase.rpc("release_seat_holds", { p_showtime_id: showtimeId });
  if (error) throw error;
}

export async function getSeatMap(showtimeId, screenId) {
  const [{ data: categories, error: catError }, { data: showtimeRow, error: stError }, taken] = await Promise.all([
    supabase.from("screen_seat_categories").select("category, seat_count, price_multiplier").eq("screen_id", screenId),
    supabase.from("showtimes").select("price").eq("id", showtimeId).single(),
    getOccupiedSeats(showtimeId),
  ]);
  if (catError) throw catError;
  if (stError) throw stError;

  const layout = buildSeatLayout(categories);
  const basePrice = showtimeRow.price;
  const lastRow = layout[layout.length - 1]?.row;

  return layout.map((rowInfo) => ({
    row: rowInfo.row,
    category: rowInfo.category,
    seats: Array.from({ length: rowInfo.count }, (_, i) => {
      const id = `${rowInfo.row}${i + 1}`;
      return {
        id,
        row: rowInfo.row,
        number: i + 1,
        occupied: taken.has(id),
        vip: rowInfo.category === "VIP",
        // Real venues designate a couple of wheelchair-accessible seats,
        // not one per row — the back row has the clearest sightline and
        // easiest access, so the first two seats there are marked instead.
        accessible: rowInfo.row === lastRow && i < 2,
        category: rowInfo.category,
        price: Math.round(basePrice * rowInfo.priceMultiplier * 100) / 100,
      };
    }),
  }));
}
