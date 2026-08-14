import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BellRing } from "lucide-react";
import Rating from "../ui/Rating";
import { formatDate } from "../../lib/format";

export default function ComingSoonCard({ movie }) {
  const [notifying, setNotifying] = useState(false);

  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
      <Link to={`/movies/${movie.id}`} className="block aspect-2/3 w-24 shrink-0 overflow-hidden rounded-lg bg-bg-secondary sm:w-28">
        <img src={movie.poster} alt={`${movie.title} poster`} loading="lazy" className="h-full w-full object-cover" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-1 font-semibold">
          <Link to={`/movies/${movie.id}`} className="text-text-primary hover:text-accent-text">
            {movie.title}
          </Link>
        </h3>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-warning">
          {formatDate(movie.releaseDate, { month: "short", day: "numeric" })}
        </p>
        <p className="mt-1.5 line-clamp-1 text-xs text-text-muted">{movie.genres.join(" • ")}</p>
        {movie.rating && (
          <div className="mt-1.5">
            <Rating value={movie.rating} size="sm" />
          </div>
        )}

        <button
          type="button"
          onClick={() => setNotifying((v) => !v)}
          aria-pressed={notifying}
          className={`mt-auto inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            notifying
              ? "bg-accent/15 text-accent-text"
              : "bg-bg-secondary text-text-secondary hover:text-text-primary"
          }`}
        >
          {notifying ? <BellRing className="h-3.5 w-3.5" aria-hidden="true" /> : <Bell className="h-3.5 w-3.5" aria-hidden="true" />}
          {notifying ? "We'll notify you" : "Notify Me"}
        </button>
      </div>
    </div>
  );
}
