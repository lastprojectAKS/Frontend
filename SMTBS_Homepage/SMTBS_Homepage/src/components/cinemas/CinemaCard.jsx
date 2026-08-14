import { MapPin, Film } from "lucide-react";
import Button from "../ui/Button";
import { getMovieById } from "../../data/movies";

export default function CinemaCard({ cinema }) {
  const movieTitles = cinema.movieIds.map((id) => getMovieById(id)?.title).filter(Boolean);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-border-strong">
      <div>
        <h3 className="text-lg font-bold text-text-primary">{cinema.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
          {cinema.location}
          <span className="text-text-muted">· {cinema.distance}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {cinema.amenities.map((amenity) => (
          <span
            key={amenity}
            className="rounded-full border border-border-strong bg-bg-secondary px-2.5 py-1 text-xs font-medium text-text-secondary"
          >
            {amenity}
          </span>
        ))}
      </div>

      <div className="flex items-start gap-1.5 text-xs text-text-muted">
        <Film className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="line-clamp-1">{movieTitles.join(", ")}</span>
      </div>

      <Button to={`/cinemas/${cinema.id}`} variant="secondary" size="sm" className="mt-auto">
        View Showtimes
      </Button>
    </div>
  );
}
