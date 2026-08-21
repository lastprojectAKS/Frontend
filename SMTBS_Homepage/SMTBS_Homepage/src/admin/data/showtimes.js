import { movies } from "./movies";
import { screens, getScreenCapacity } from "./screens";
import { addDays } from "../lib/dateUtils";

export const SHOWTIME_STATUSES = ["Scheduled", "Completed", "Cancelled"];

const TIME_SLOTS = ["10:30", "13:15", "16:00", "19:00", "21:45"];
const BASE_PRICE_BY_TYPE = { Standard: 12, Premium: 16, IMAX: 19 };

function addMinutes(time, minutes) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total % (24 * 60)) / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function dateOffset(days) {
  return addDays("2026-08-21", days);
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const nowShowingMovies = movies.filter((m) => m.status === "Now Showing");
const activeScreens = screens.filter((s) => s.status === "Active");

// Seeded, not random — same demo data every load. Each screen gets a
// rotating pair of movies per day across TIME_SLOTS, with a 20 min buffer
// between showings, so no two showtimes on the same screen ever overlap.
let seed = [];
let counter = 1;

for (let dayOffset = -3; dayOffset <= 10; dayOffset += 1) {
  const date = dateOffset(dayOffset);

  activeScreens.forEach((screen) => {
    const screenSeed = hashString(`${screen.id}-${date}`);
    const moviePool = [
      nowShowingMovies[screenSeed % nowShowingMovies.length],
      nowShowingMovies[(screenSeed + 1) % nowShowingMovies.length],
    ];

    let cursor = TIME_SLOTS[0];
    TIME_SLOTS.forEach((slot, i) => {
      const movie = moviePool[i % moviePool.length];
      const startTime = i === 0 ? slot : cursor;
      const endTime = addMinutes(startTime, movie.duration + 20);
      cursor = endTime;

      const capacity = getScreenCapacity(screen);
      const occupancyBucket = (screenSeed + i) % 10;
      const isPast = dayOffset < 0 || (dayOffset === 0 && false);
      const bookedSeats = Math.min(
        capacity,
        Math.round(capacity * (occupancyBucket < 2 ? 0.15 : occupancyBucket < 6 ? 0.45 : 0.8))
      );

      let status = "Scheduled";
      if (isPast) status = "Completed";
      if (occupancyBucket === 9 && dayOffset > 2) status = "Cancelled";

      seed.push({
        id: `st-${String(counter).padStart(4, "0")}`,
        movieId: movie.id,
        cinemaId: screen.cinemaId,
        screenId: screen.id,
        date,
        startTime,
        endTime,
        price: BASE_PRICE_BY_TYPE[screen.type] ?? 12,
        totalSeats: capacity,
        bookedSeats: status === "Cancelled" ? 0 : bookedSeats,
        status,
      });
      counter += 1;
    });
  });
}

// Exported as a mutable "table" — admin/services/showtimeService.js is the
// only thing that should mutate this array (create/update/cancel).
export const showtimes = seed;

export const getShowtimeById = (id) => showtimes.find((s) => s.id === id);
