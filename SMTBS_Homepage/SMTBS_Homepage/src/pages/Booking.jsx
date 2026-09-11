import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { CalendarX, MapPin, Loader2, UserRound } from "lucide-react";
import Button from "../components/ui/Button";
import Rating from "../components/ui/Rating";
import EmptyState from "../components/ui/EmptyState";
import { useBooking } from "../context/BookingContext";
import { useAuth } from "../context/AuthContext";
import { getMovie } from "../services/movieService";
import { getCinemasForMovie } from "../services/cinemaService";
import { getShowtimeDates, getShowtimesForDate } from "../services/showtimeService";
import { formatDuration } from "../lib/format";

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn, openAuthModal } = useAuth();
  const { selection, setMovie, setCinema, setDate, setTime } = useBooking();

  const queryMovieId = searchParams.get("movie");
  const queryCinemaId = searchParams.get("cinema");

  const [movie, setMovieData] = useState(null);
  const [movieLoading, setMovieLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cinemas, setCinemas] = useState([]);
  const [dateOptions, setDateOptions] = useState([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [showtimes, setShowtimes] = useState([]);
  const [showtimesLoading, setShowtimesLoading] = useState(false);

  const movieId = selection.movieId || queryMovieId;

  useEffect(() => {
    if (queryMovieId && queryMovieId !== selection.movieId) setMovie(queryMovieId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryMovieId]);

  useEffect(() => {
    if (queryCinemaId && selection.movieId === queryMovieId) setCinema(queryCinemaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryCinemaId, selection.movieId]);

  // Load the movie, then the cinemas showing it.
  useEffect(() => {
    if (!movieId) {
      setMovieLoading(false);
      return;
    }
    let cancelled = false;
    setMovieLoading(true);
    getMovie(movieId).then((movieData) => {
      if (cancelled) return;
      if (!movieData) {
        setNotFound(true);
        setMovieLoading(false);
        return;
      }
      setMovieData(movieData);
      getCinemasForMovie(movieData.id).then((cinemaData) => {
        if (!cancelled) {
          setCinemas(cinemaData);
          setMovieLoading(false);
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [movieId]);

  // Once a cinema is chosen, load the real dates that actually have showtimes.
  useEffect(() => {
    if (!movie || !selection.cinemaId) {
      setDateOptions([]);
      return;
    }
    let cancelled = false;
    setDatesLoading(true);
    getShowtimeDates(movie.id, selection.cinemaId).then((dates) => {
      if (!cancelled) {
        setDateOptions(dates);
        setDatesLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [movie, selection.cinemaId]);

  // Once a date is chosen, load the real showtimes for it.
  useEffect(() => {
    if (!movie || !selection.cinemaId || !selection.date) {
      setShowtimes([]);
      return;
    }
    let cancelled = false;
    setShowtimesLoading(true);
    getShowtimesForDate(movie.id, selection.cinemaId, selection.date).then((data) => {
      if (!cancelled) {
        setShowtimes(data);
        setShowtimesLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [movie, selection.cinemaId, selection.date]);

  const hasAvailableShowtime = showtimes.some((s) => s.status !== "sold-out");
  const canContinue = Boolean(selection.movieId && selection.cinemaId && selection.date && selection.time);

  if (movieLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
      </div>
    );
  }

  if (notFound || !movie) return <Navigate to="/movies" replace />;

  // Booking requires an account — there's no guest checkout, since a real
  // booking needs a real customer_id to attach to.
  if (!isLoggedIn) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-text-muted">
          <UserRound className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Sign in to book tickets</h1>
        <p className="text-text-secondary">
          Create a free account or log in to book seats for {movie.title}.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => openAuthModal("login")}>Log In</Button>
          <Button variant="secondary" onClick={() => openAuthModal("signup")}>
            Sign Up
          </Button>
        </div>
      </div>
    );
  }

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
          {datesLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" aria-hidden="true" />
          ) : dateOptions.length === 0 ? (
            <p className="text-sm text-text-secondary">No upcoming showtimes at this cinema for this movie.</p>
          ) : (
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
          )}
        </section>
      )}

      {selection.date && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-text-primary">3. Select Showtime</h2>
          {showtimesLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" aria-hidden="true" />
          ) : !hasAvailableShowtime ? (
            <EmptyState
              icon={CalendarX}
              title="No showtimes available"
              description="Every screening on this date is sold out. Try another date or cinema."
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {showtimes.map((show) => {
                const active = selection.showtimeId === show.id;
                const soldOut = show.status === "sold-out";
                return (
                  <button
                    key={show.id}
                    type="button"
                    disabled={soldOut}
                    onClick={() => setTime(show.time, show.id, show.screenId)}
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
