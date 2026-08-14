import { useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { CalendarX, MapPin } from "lucide-react";
import Button from "../components/ui/Button";
import Rating from "../components/ui/Rating";
import EmptyState from "../components/ui/EmptyState";
import { useBooking } from "../context/BookingContext";
import { getMovieById } from "../data/movies";
import { getCinemasForMovie } from "../data/cinemas";
import { getDateOptions, getShowtimes } from "../data/showtimes";
import { formatDuration } from "../lib/format";

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selection, setMovie, setCinema, setDate, setTime } = useBooking();

  const queryMovieId = searchParams.get("movie");
  const queryCinemaId = searchParams.get("cinema");

  useEffect(() => {
    if (queryMovieId && queryMovieId !== selection.movieId) {
      setMovie(queryMovieId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryMovieId]);

  useEffect(() => {
    if (queryCinemaId && selection.movieId === queryMovieId) {
      setCinema(queryCinemaId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryCinemaId, selection.movieId]);

  const movieId = selection.movieId || queryMovieId;
  const movie = movieId ? getMovieById(movieId) : null;

  const cinemas = useMemo(() => (movie ? getCinemasForMovie(movie.id) : []), [movie]);
  const dateOptions = useMemo(() => getDateOptions(), []);

  const showtimes = useMemo(() => {
    if (!selection.cinemaId || !selection.date) return [];
    return getShowtimes(movie?.id, selection.cinemaId, selection.date);
  }, [movie?.id, selection.cinemaId, selection.date]);

  const hasAvailableShowtime = showtimes.some((s) => s.status !== "sold-out");
  const canContinue = Boolean(selection.movieId && selection.cinemaId && selection.date && selection.time);

  if (!movie) return <Navigate to="/movies" replace />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
        <img src={movie.poster} alt={`${movie.title} poster`} className="h-24 w-16 shrink-0 rounded-lg object-cover" />
        <div>
          <h1 className="font-bold text-text-primary">{movie.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
            <Rating value={movie.rating} size="sm" />
            <span aria-hidden="true">·</span>
            <span>{formatDuration(movie.duration)}</span>
            <span aria-hidden="true">·</span>
            <span>{movie.genres.join(", ")}</span>
          </div>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-text-primary">1. Select Cinema</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cinemas.map((cinema) => {
            const active = selection.cinemaId === cinema.id;
            return (
              <button
                key={cinema.id}
                type="button"
                onClick={() => setCinema(cinema.id)}
                aria-pressed={active}
                className={`flex items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
                  active ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                <MapPin className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-accent" : "text-text-muted"}`} aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-text-primary">{cinema.name}</span>
                  <span className="block text-xs text-text-muted">{cinema.location}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {selection.cinemaId && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-text-primary">2. Select Date</h2>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {dateOptions.map((option) => {
              const active = selection.date === option.iso;
              return (
                <button
                  key={option.iso}
                  type="button"
                  onClick={() => setDate(option.iso)}
                  aria-pressed={active}
                  className={`flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-xl border py-3 transition-colors ${
                    active ? "border-accent bg-accent/10 text-accent-text" : "border-border bg-surface text-text-secondary hover:border-border-strong"
                  }`}
                >
                  <span className="text-xs font-medium uppercase">{option.label}</span>
                  <span className="text-lg font-bold">{option.dayNumber}</span>
                  <span className="text-[10px] uppercase text-text-muted">{option.month}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {selection.date && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-text-primary">3. Select Showtime</h2>
          {!hasAvailableShowtime ? (
            <EmptyState
              icon={CalendarX}
              title="No showtimes available"
              description="Every screening on this date is sold out. Try another date or cinema."
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {showtimes.map((show) => {
                const active = selection.time === show.time;
                const soldOut = show.status === "sold-out";
                return (
                  <button
                    key={show.time}
                    type="button"
                    disabled={soldOut}
                    onClick={() => setTime(show.time)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-0.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      active ? "border-accent bg-accent text-white" : "border-border bg-surface text-text-primary hover:border-border-strong"
                    }`}
                  >
                    {show.time}
                    {show.status === "few-seats" && !active && (
                      <span className="text-[10px] font-medium text-warning">Few seats</span>
                    )}
                    {soldOut && <span className="text-[10px] font-medium text-text-muted">Sold out</span>}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      <div className="flex justify-end">
        <Button size="lg" disabled={!canContinue} onClick={() => canContinue && navigate("/booking/seats")}>
          Continue to Seats
        </Button>
      </div>
    </div>
  );
}
