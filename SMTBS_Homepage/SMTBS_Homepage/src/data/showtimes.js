const BASE_TIMES = ["10:30 AM", "1:15 PM", "4:00 PM", "7:30 PM", "10:15 PM"];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDateOptions(count = 5) {
  const options = [];
  const today = new Date();

  for (let i = 0; i < count; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    options.push({
      iso: date.toISOString().slice(0, 10),
      label:
        i === 0
          ? "Today"
          : i === 1
            ? "Tomorrow"
            : date.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
    });
  }

  return options;
}

// Deterministic per movie/cinema/date so the same selection always shows
// the same availability, without needing a backend.
export function getShowtimes(movieId, cinemaId, dateIso) {
  const seed = hashString(`${movieId}-${cinemaId}-${dateIso}`);

  return BASE_TIMES.map((time, index) => {
    const bucket = (seed + index * 13) % 9;
    const status = bucket === 0 ? "sold-out" : bucket <= 2 ? "few-seats" : "available";
    return { time, status };
  });
}

export const TICKET_PRICE = 12;
export const VIP_TICKET_PRICE = 18;
export const BOOKING_FEE = 2.5;
