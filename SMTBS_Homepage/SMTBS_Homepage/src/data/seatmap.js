export const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
export const SEATS_PER_ROW = 10;
export const VIP_ROWS = ["G", "H"];
export const ACCESSIBLE_SEATS = ["A1", "A10"];

export function isVipSeat(seatId) {
  return VIP_ROWS.includes(seatId[0]);
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Deterministic per movie/cinema/date/time so the same showtime always
// shows the same occupied seats, without needing a backend.
export function generateSeatMap(key) {
  const seed = hashString(key);

  return ROWS.map((row) => {
    const seats = [];
    for (let i = 1; i <= SEATS_PER_ROW; i += 1) {
      const id = `${row}${i}`;
      const bucket = (seed + row.charCodeAt(0) * 7 + i * 3) % 10;
      seats.push({
        id,
        row,
        number: i,
        occupied: bucket < 2,
        vip: VIP_ROWS.includes(row),
        accessible: ACCESSIBLE_SEATS.includes(id),
      });
    }
    return { row, seats };
  });
}
