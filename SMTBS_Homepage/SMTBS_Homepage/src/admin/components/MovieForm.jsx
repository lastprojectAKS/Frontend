import { useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import Button from "../../components/ui/Button";
import { MOVIE_STATUSES, uploadMovieImage } from "../services/movieService";
import { PLACEHOLDER_POSTER } from "../lib/placeholder";

const AGE_RATINGS = ["G", "PG", "PG-13", "R", "NC-17"];

const inputClass =
  "h-11 w-full rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent";
const labelClass = "flex flex-col gap-1.5 text-sm";
const captionClass = "font-medium text-text-secondary";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// URL field stays editable (pasting a link to an already-hosted image is
// still the fastest path for, say, a poster pulled from a press kit) —
// "Upload image" is an alternative way to fill the same field, not a
// replacement for it. Not wrapped in a single <label>, since it has two
// separately-focusable controls (the URL input and the upload button);
// only the URL input gets an explicit htmlFor association.
function ImageUploadField({ id, label, value, onChange, placeholder }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // so picking the same file again still fires onChange
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be under 5MB.");
      return;
    }

    setError("");
    setUploading(true);
    try {
      const url = await uploadMovieImage(file);
      onChange(url);
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label htmlFor={id} className={captionClass}>
        {label}
      </label>
      <div className="flex items-start gap-3">
        <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-border-strong bg-bg-secondary">
          {value && <img src={value} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputClass}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs font-semibold text-accent-text hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload image"}
            </button>
            {error && <span className="text-xs text-error">{error}</span>}
          </div>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
}

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
    // cast_members is jsonb {name, role} on the real table, not a flat
    // string list — always keep at least one blank row so the form has
    // something to render on "Add movie".
    cast: movie?.cast?.length > 0 ? movie.cast.map((c) => ({ name: c.name ?? "", role: c.role ?? "" })) : [{ name: "", role: "" }],
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

  function updateCastMember(index, field, value) {
    setForm((f) => ({
      ...f,
      cast: f.cast.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }));
  }

  function addCastMember() {
    setForm((f) => ({ ...f, cast: [...f.cast, { name: "", role: "" }] }));
  }

  function removeCastMember(index) {
    setForm((f) => ({ ...f, cast: f.cast.filter((_, i) => i !== index) }));
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
      cast: form.cast.map((c) => ({ name: c.name.trim(), role: c.role.trim() })).filter((c) => c.name),
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
        <ImageUploadField
          id="movie-poster"
          label="Poster"
          value={form.poster}
          onChange={(value) => update("poster", value)}
          placeholder="/images/movie.jpg"
        />
        <ImageUploadField
          id="movie-backdrop"
          label="Backdrop"
          value={form.backdrop}
          onChange={(value) => update("backdrop", value)}
          placeholder="Defaults to poster"
        />
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

      <div className="flex flex-col gap-2">
        <span className={captionClass}>Cast</span>
        <div className="flex flex-col gap-2">
          {form.cast.map((member, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={member.name}
                onChange={(e) => updateCastMember(index, "name", e.target.value)}
                placeholder="Actor name"
                className={inputClass}
              />
              <input
                value={member.role}
                onChange={(e) => updateCastMember(index, "role", e.target.value)}
                placeholder="Role"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeCastMember(index)}
                aria-label="Remove cast member"
                disabled={form.cast.length === 1}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-error disabled:opacity-40"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" size="sm" icon={Plus} className="w-fit" onClick={addCastMember}>
          Add cast member
        </Button>
      </div>

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
