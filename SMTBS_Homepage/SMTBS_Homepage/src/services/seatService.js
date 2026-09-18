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

export async function getSeatMap(showtimeId, screenId) {
  const [{ data: categories, error: catError }, { data: showtimeRow, error: stError }, { data: takenRows, error: seatError }] = await Promise.all([
    supabase.from("screen_seat_categories").select("category, seat_count, price_multiplier").eq("screen_id", screenId),
    supabase.from("showtimes").select("price").eq("id", showtimeId).single(),
    supabase.from("booking_seats").select("seat_label").eq("showtime_id", showtimeId).eq("status", "confirmed"),
  ]);
  if (catError) throw catError;
  if (stError) throw stError;
  if (seatError) throw seatError;

  const layout = buildSeatLayout(categories);
  const taken = new Set(takenRows.map((r) => r.seat_label));
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
