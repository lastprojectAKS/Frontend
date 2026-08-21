// Pure calendar-date math on "YYYY-MM-DD" strings, deliberately avoiding
// `new Date(str).toISOString()` round-trips. That pattern interprets the
// input as LOCAL midnight but reads it back out in UTC, which silently
// shifts the date by a day on any machine set to a timezone ahead of UTC
// (e.g. Sydney) — the mock data and reports would end up dated differently
// depending on where the app happens to run. Anchoring everything to
// Date.UTC instead makes the arithmetic timezone-independent.

function toParts(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y, m, d };
}

function fromParts(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
}

export function addDays(dateStr, days) {
  const { y, m, d } = toParts(dateStr);
  return fromParts(y, m, d + days);
}

export function startOfWeek(dateStr) {
  const { y, m, d } = toParts(dateStr);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return addDays(dateStr, -dow);
}

export function startOfMonth(dateStr) {
  const { y, m } = toParts(dateStr);
  return fromParts(y, m, 1);
}

export function startOfPreviousMonth(dateStr) {
  const { y, m } = toParts(dateStr);
  return m === 1 ? fromParts(y - 1, 12, 1) : fromParts(y, m - 1, 1);
}

export function endOfPreviousMonth(dateStr) {
  // Day 0 of the current month rolls back to the last day of the one before.
  const { y, m } = toParts(dateStr);
  return fromParts(y, m, 0);
}

export function dateRangeBetween(startDate, endDate) {
  const dates = [];
  let cursor = startDate;
  let guard = 0;
  while (cursor <= endDate && guard < 3660) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return dates;
}
