import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import Button from "../../components/ui/Button";
import { listMovies } from "../services/movieService";
import { listCinemas, listScreens } from "../services/cinemaService";
import { validateShowtime } from "../services/showtimeService";
import { isShowtimeInPast } from "../lib/businessRules";

const inputClass =
  "h-11 w-full rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50";
const labelClass = "flex flex-col gap-1.5 text-sm";
const captionClass = "font-medium text-text-secondary";

function addMinutes(time, minutes) {
  const [h, m] = time.split(":").map(Number);
  const total = ((h * 60 + m + minutes) % (24 * 60) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function ShowtimeForm({ showtime, onSubmit, onCancel, submitting = false, submitLabel = "Save showtime" }) {
  const isPast = showtime ? isShowtimeInPast(showtime) : false;

  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [cinemaScreens, setCinemaScreens] = useState([]);

  const bookableMovies = movies.filter((m) => m.status === "Now Showing" || m.status === "Upcoming");

  const [form, setForm] = useState({
    movieId: showtime?.movieId ?? "",
    cinemaId: showtime?.cinemaId ?? "",
    screenId: showtime?.screenId ?? "",
    date: showtime?.date ?? "",
    startTime: showtime?.startTime ?? "",
    endTime: showtime?.endTime ?? "",
    price: showtime?.price ?? "",
  });
  const [errors, setErrors] = useState({});

  // Load movies/cinemas once, and default the form to the first bookable
  // movie/cinema when creating new (editing keeps whatever the showtime has).
  useEffect(() => {
    let cancelled = false;
    Promise.all([listMovies(), listCinemas()]).then(([movieData, cinemaData]) => {
      if (cancelled) return;
      setMovies(movieData);
      setCinemas(cinemaData);
      if (!showtime) {
        const firstBookable = movieData.find((m) => m.status === "Now Showing" || m.status === "Upcoming");
        setForm((f) => ({ ...f, movieId: f.movieId || firstBookable?.id || "", cinemaId: f.cinemaId || cinemaData[0]?.id || "" }));
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Screens depend on the selected cinema — reload whenever it changes.
  useEffect(() => {
    if (!form.cinemaId) {
      setCinemaScreens([]);
      return;
    }
    let cancelled = false;
    listScreens(form.cinemaId).then((data) => {
      if (!cancelled) setCinemaScreens(data);
    });
    return () => {
      cancelled = true;
    };
  }, [form.cinemaId]);

  function update(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "cinemaId") {
        next.screenId = "";
      }
      if ((field === "movieId" || field === "startTime") && next.movieId && next.startTime) {
        const movie = movies.find((m) => m.id === next.movieId);
        if (movie) next.endTime = addMinutes(next.startTime, movie.duration + 20);
      }
      return next;
    });
  }

  // Once screens load for a cinema, default to the first one (create only).
  useEffect(() => {
    if (!showtime && cinemaScreens.length > 0 && !form.screenId) {
      setForm((f) => ({ ...f, screenId: cinemaScreens[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cinemaScreens]);

  // Async validation is now the same pattern as ScreenForm's capacity check:
  // a live effect keeps an inline warning current, and handleSubmit re-runs
  // the authoritative check right before saving.
  const [validation, setValidation] = useState(null);
  useEffect(() => {
    if (!form.movieId || !form.cinemaId || !form.screenId || !form.date || !form.startTime || !form.endTime) {
      setValidation(null);
      return;
    }
    let cancelled = false;
    validateShowtime({ ...form, excludeShowtimeId: showtime?.id }).then((result) => {
      if (!cancelled) setValidation(result);
    });
    return () => {
      cancelled = true;
    };
  }, [form, showtime]);

  const selectedScreen = cinemaScreens.find((s) => s.id === form.screenId);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.price || Number(form.price) <= 0) {
      setErrors({ price: "Enter a valid ticket price." });
      return;
    }

    const check = await validateShowtime({ ...form, excludeShowtimeId: showtime?.id });
    if (check) {
      setValidation(check);
      return;
    }

    onSubmit({ ...form, price: Number(form.price) });
  }

  if (isPast) {
    return (
      <div>
        <p className="rounded-lg bg-warning/10 px-3.5 py-3 text-sm text-warning">
          This showtime has already played and can't be edited. Past showtimes can only be cancelled.
        </p>
        <Button type="button" variant="secondary" className="mt-4 w-full" onClick={onCancel}>
          Close
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={labelClass}>
        <span className={captionClass}>Movie</span>
        <select value={form.movieId} onChange={(e) => update("movieId", e.target.value)} className={inputClass}>
          {bookableMovies.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title} ({m.status})
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className={captionClass}>Cinema</span>
          <select value={form.cinemaId} onChange={(e) => update("cinemaId", e.target.value)} className={inputClass}>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.status === "Inactive" ? "(Inactive)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={captionClass}>Screen</span>
          <select value={form.screenId} onChange={(e) => update("screenId", e.target.value)} className={inputClass}>
            {cinemaScreens.length === 0 && <option value="">No screens</option>}
            {cinemaScreens.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.type}, {s.capacity} seats) {s.status === "Inactive" ? "(Inactive)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          <span className={captionClass}>Date</span>
          <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={captionClass}>Start time</span>
          <input type="time" value={form.startTime} onChange={(e) => update("startTime", e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={captionClass}>End time</span>
          <input type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} className={inputClass} />
        </label>
      </div>

      <label className={labelClass}>
        <span className={captionClass}>Ticket price ($)</span>
        <input
          type="number"
          min={1}
          step={0.5}
          value={form.price}
          onChange={(e) => update("price", e.target.value)}
          placeholder={selectedScreen ? String({ Standard: 12, Premium: 16, IMAX: 19 }[selectedScreen.type] ?? 12) : ""}
          className={inputClass}
        />
        {errors.price && <span className="text-xs text-error">{errors.price}</span>}
      </label>

      {validation && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-3.5 py-3 text-sm text-error">
          <p className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {validation.field === "conflict" ? "Showtime Conflict" : "Can't schedule this showtime"}
          </p>
          <p className="mt-1 text-error/90">{validation.message}</p>
        </div>
      )}

      <div className="mt-2 flex gap-3">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting || !!validation}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : submitLabel}
        </Button>
      </div>
    </form>
  );
}
