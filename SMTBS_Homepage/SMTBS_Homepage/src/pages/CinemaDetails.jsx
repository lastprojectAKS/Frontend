import { useParams, Navigate } from "react-router-dom";
import { MapPin, Ticket } from "lucide-react";
import Button from "../components/ui/Button";
import Rating from "../components/ui/Rating";
import { getCinemaById } from "../data/cinemas";
import { getMovieById } from "../data/movies";
import { formatDuration } from "../lib/format";

export default function CinemaDetails() {
  const { id } = useParams();
  const cinema = getCinemaById(id);

  if (!cinema) return <Navigate to="/cinemas" replace />;

  const nowShowing = cinema.movieIds.map((movieId) => getMovieById(movieId)).filter(Boolean);

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
