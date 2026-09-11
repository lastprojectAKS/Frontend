import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { MapPin, Ticket, Loader2 } from "lucide-react";
import Button from "../components/ui/Button";
import Rating from "../components/ui/Rating";
import { getCinema } from "../services/cinemaService";
import { getMovie } from "../services/movieService";
import { formatDuration } from "../lib/format";

export default function CinemaDetails() {
  const { id } = useParams();
  const [cinema, setCinema] = useState(null);
  const [nowShowing, setNowShowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCinema(id).then((cinemaData) => {
      if (cancelled) return;
      if (!cinemaData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCinema(cinemaData);
      Promise.all(cinemaData.movieIds.map((movieId) => getMovie(movieId))).then((movies) => {
        if (!cancelled) {
          setNowShowing(movies.filter(Boolean));
          setLoading(false);
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
      </div>
    );
  }

  if (notFound || !cinema) return <Navigate to="/cinemas" replace />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">{cinema.name}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-text-secondary">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          {cinema.location} · {cinema.distance}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {cinema.amenities.map((amenity) => (
            <span
              key={amenity}
              className="rounded-full border border-border-strong bg-surface px-3 py-1 text-xs font-medium text-text-secondary"
            >
              {amenity}
            </span>
          ))}
        </div>
      </div>

      <h2 className="mb-4 text-xl font-bold text-text-primary">Now Showing Here</h2>
      <div className="flex flex-col gap-3">
        {nowShowing.map((movie) => (
          <div
            key={movie.id}
            className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-4">
              <img src={movie.poster} alt={`${movie.title} poster`} className="h-20 w-14 rounded-lg object-cover" />
              <div>
                <p className="font-semibold text-text-primary">{movie.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                  <Rating value={movie.rating} size="sm" />
                  <span aria-hidden="true">·</span>
                  <span>{formatDuration(movie.duration)}</span>
                </div>
              </div>
            </div>
            <Button to={`/booking?movie=${movie.id}&cinema=${cinema.id}`} size="sm" icon={Ticket}>
              Select Showtime
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
