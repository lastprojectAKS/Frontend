import { useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "../../components/ui/Button";
import { MOVIE_STATUSES } from "../data/movies";
import { PLACEHOLDER_POSTER } from "../lib/placeholder";

const AGE_RATINGS = ["G", "PG", "PG-13", "R", "NC-17"];

const inputClass =
  "h-11 w-full rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent";
const labelClass = "flex flex-col gap-1.5 text-sm";
const captionClass = "font-medium text-text-secondary";

function toFormState(movie) {
  return {
    title: movie?.title ?? "",
    poster: movie?.poster ?? "",
    backdrop: movie?.backdrop ?? "",
    genres: movie?.genres?.join(", ") ?? "",
    duration: movie?.duration ?? "",
    language: movie?.language ?? "English",
    ageRating: movie?.ageRating ?? AGE_RATINGS[1],
    director: movie?.director ?? "",
    cast: movie?.cast?.join(", ") ?? "",
    releaseDate: movie?.releaseDate ?? "",
    endDate: movie?.endDate ?? "",
    trailerUrl: movie?.trailerUrl ?? "",
    status: movie?.status ?? MOVIE_STATUSES[0],
    rating: movie?.rating ?? "",
    description: movie?.description ?? "",
  };
}

export default function MovieForm({ movie, onSubmit, onCancel, submitting = false, submitLabel = "Save movie" }) {
  const [form, setForm] = useState(() => toFormState(movie));
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.genres.trim()) next.genres = "At least one genre is required.";
    if (!form.duration || Number(form.duration) <= 0) next.duration = "Enter a runtime in minutes.";
    if (!form.director.trim()) next.director = "Director is required.";
    if (!form.releaseDate) next.releaseDate = "Release date is required.";
    if (!form.endDate) next.endDate = "End date is required.";
    if (form.releaseDate && form.endDate && form.endDate < form.releaseDate) {
      next.endDate = "End date must be on or after the release date.";
    }
    if (form.rating !== "" && (Number(form.rating) < 0 || Number(form.rating) > 10)) {
      next.rating = "Rating must be between 0 and 10.";
    }
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    onSubmit({
      title: form.title.trim(),
      poster: form.poster.trim() || PLACEHOLDER_POSTER,
      backdrop: form.backdrop.trim() || form.poster.trim() || PLACEHOLDER_POSTER,
      genres: form.genres.split(",").map((g) => g.trim()).filter(Boolean),
      duration: Number(form.duration),
      language: form.language.trim() || "English",
      ageRating: form.ageRating,
      director: form.director.trim(),
      cast: form.cast.split(",").map((c) => c.trim()).filter(Boolean),
      releaseDate: form.releaseDate,
      endDate: form.endDate,
      trailerUrl: form.trailerUrl.trim(),
      status: form.status,
      rating: form.rating === "" ? 0 : Number(form.rating),
      description: form.description.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={labelClass}>
        <span className={captionClass}>Title</span>
        <input
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Dune: Part Two"
          className={inputClass}
        />
        {errors.title && <span className="text-xs text-error">{errors.title}</span>}
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className={captionClass}>Poster URL</span>
          <input
            value={form.poster}
            onChange={(e) => update("poster", e.target.value)}
            placeholder="/images/movie.jpg"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className={captionClass}>Backdrop URL</span>
          <input
            value={form.backdrop}
            onChange={(e) => update("backdrop", e.target.value)}
            placeholder="Defaults to poster"
            className={inputClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        <span className={captionClass}>Genres (comma separated)</span>
        <input
          value={form.genres}
          onChange={(e) => update("genres", e.target.value)}
          placeholder="Sci-Fi, Adventure"
          className={inputClass}
        />
        {errors.genres && <span className="text-xs text-error">{errors.genres}</span>}
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className={labelClass}>
          <span className={captionClass}>Duration (min)</span>
          <input
            type="number"
            min={1}
            value={form.duration}
            onChange={(e) => update("duration", e.target.value)}
            className={inputClass}
          />
          {errors.duration && <span className="text-xs text-error">{errors.duration}</span>}
        </label>
        <label className={labelClass}>
          <span className={captionClass}>Language</span>
          <input value={form.language} onChange={(e) => update("language", e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={captionClass}>Age rating</span>
          <select value={form.ageRating} onChange={(e) => update("ageRating", e.target.value)} className={inputClass}>
            {AGE_RATINGS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={captionClass}>Rating (0-10)</span>
          <input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={form.rating}
            onChange={(e) => update("rating", e.target.value)}
            className={inputClass}
          />
          {errors.rating && <span className="text-xs text-error">{errors.rating}</span>}
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className={captionClass}>Director</span>
          <input value={form.director} onChange={(e) => update("director", e.target.value)} className={inputClass} />
          {errors.director && <span className="text-xs text-error">{errors.director}</span>}
        </label>
        <label className={labelClass}>
          <span className={captionClass}>Status</span>
          <select value={form.status} onChange={(e) => update("status", e.target.value)} className={inputClass}>
            {MOVIE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={labelClass}>
        <span className={captionClass}>Cast (comma separated)</span>
        <input
          value={form.cast}
          onChange={(e) => update("cast", e.target.value)}
          placeholder="Timothée Chalamet, Zendaya"
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className={captionClass}>Release date</span>
          <input
            type="date"
            value={form.releaseDate}
            onChange={(e) => update("releaseDate", e.target.value)}
            className={inputClass}
          />
          {errors.releaseDate && <span className="text-xs text-error">{errors.releaseDate}</span>}
        </label>
        <label className={labelClass}>
          <span className={captionClass}>End date</span>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => update("endDate", e.target.value)}
            className={inputClass}
          />
          {errors.endDate && <span className="text-xs text-error">{errors.endDate}</span>}
        </label>
      </div>

      <label className={labelClass}>
        <span className={captionClass}>Trailer URL</span>
        <input value={form.trailerUrl} onChange={(e) => update("trailerUrl", e.target.value)} className={inputClass} />
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Description</span>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-border-strong bg-bg-secondary px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <div className="mt-2 flex gap-3">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : submitLabel}
        </Button>
      </div>
    </form>
  );
}
