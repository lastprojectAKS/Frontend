import { MOVIE_STATUSES } from "../services/movieService";
import { PLACEHOLDER_POSTER } from "./placeholder";

// Kept in sync by hand with MovieForm.jsx's AGE_RATINGS — not imported from
// there since that file doesn't export it (it's a local constant), and
// pulling in a whole form component just for this array isn't worth it.
const AGE_RATINGS = ["G", "PG", "PG-13", "R", "NC-17"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Validates and maps one CSV record (from parseCsvRecords) into the same
// shape MovieForm's onSubmit produces, or a list of human-readable reasons
// it can't be imported. Mirrors MovieForm's own validate() rules — a
// bulk-imported row has to clear the same bar a manually-added movie would.
export function mapCsvRecordToMovie(record, rowNumber) {
  const errors = [];

  const title = (record.title ?? "").trim();
  if (!title) errors.push("missing title");

  const genres = (record.genres ?? "")
    .split(";")
    .map((g) => g.trim())
    .filter(Boolean);
  if (genres.length === 0) errors.push("missing genres (semicolon-separated)");

  const duration = Number(record.duration);
  if (!record.duration?.trim() || !Number.isFinite(duration) || duration <= 0) {
    errors.push("missing/invalid duration (minutes, > 0)");
  }

  const director = (record.director ?? "").trim();
  if (!director) errors.push("missing director");

  const releaseDate = (record.releaseDate ?? "").trim();
  if (!releaseDate || !DATE_RE.test(releaseDate)) errors.push("missing/invalid releaseDate (expected YYYY-MM-DD)");

  const endDate = (record.endDate ?? "").trim();
  if (!endDate || !DATE_RE.test(endDate)) {
    errors.push("missing/invalid endDate (expected YYYY-MM-DD)");
  } else if (releaseDate && DATE_RE.test(releaseDate) && endDate < releaseDate) {
    errors.push("endDate is before releaseDate");
  }

  let rating = 0;
  if (record.rating?.trim()) {
    rating = Number(record.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) errors.push("rating must be between 0 and 10");
  }

  const status = (record.status ?? "").trim() || "Draft";
  if (!MOVIE_STATUSES.includes(status)) {
    errors.push(`invalid status "${status}" (expected one of ${MOVIE_STATUSES.join(", ")})`);
  }

  const ageRating = (record.ageRating ?? "").trim() || "PG";
  if (!AGE_RATINGS.includes(ageRating)) {
    errors.push(`invalid ageRating "${ageRating}" (expected one of ${AGE_RATINGS.join(", ")})`);
  }

  if (errors.length > 0) {
    return { ok: false, row: rowNumber, title: title || `(row ${rowNumber})`, errors };
  }

  const cast = (record.cast ?? "")
    .split(";")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, role: "" }));

  return {
    ok: true,
    row: rowNumber,
    data: {
      title,
      genres,
      duration,
      director,
      releaseDate,
      endDate,
      status,
      rating,
      language: (record.language ?? "").trim() || "English",
      ageRating,
      cast,
      // Same fallback MovieForm applies on submit (poster defaults to a
      // placeholder; backdrop defaults to poster, then the placeholder) —
      // replicated here since bulk import never goes through that form.
      poster: (record.poster ?? "").trim() || PLACEHOLDER_POSTER,
      backdrop: (record.backdrop ?? "").trim() || (record.poster ?? "").trim() || PLACEHOLDER_POSTER,
      trailerUrl: (record.trailerUrl ?? "").trim(),
      description: (record.description ?? "").trim(),
    },
  };
}
