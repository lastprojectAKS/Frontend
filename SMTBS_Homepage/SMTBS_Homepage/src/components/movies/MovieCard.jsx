import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Ticket, Heart } from "lucide-react";
import Rating from "../ui/Rating";
import Badge from "../ui/Badge";
import TrailerModal from "./TrailerModal";
import { formatDuration } from "../../lib/format";
import { isComingSoon as checkIsComingSoon } from "../../services/movieService";
import { useFavourites } from "../../context/FavouritesContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function MovieCard({ movie }) {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const isComingSoon = checkIsComingSoon(movie);
  const { isFavourite, toggleFavourite } = useFavourites();
  const { openAuthModal } = useAuth();
  const { showToast } = useToast();
  const favourited = isFavourite(movie.id);

  async function handleToggleFavourite(e) {
    e.preventDefault();
    e.stopPropagation();
    const result = await toggleFavourite(movie.id);
    if (result.requiresLogin) {
      openAuthModal("login");
    } else if (!result.success) {
      showToast(result.error || "Couldn't update favourites. Please try again.");
    }
  }

  return (
    <>
      <div className="group flex flex-col">
        <div className="relative aspect-2/3 overflow-hidden rounded-xl bg-surface">
          <Link to={`/movies/${movie.id}`} className="absolute inset-0" aria-label={`View details for ${movie.title}`}>
            <motion.img
              src={movie.poster}
              alt={`${movie.title} poster`}
              loading="lazy"
              className="h-full w-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </Link>

          <div className="pointer-events-none absolute left-2.5 top-2.5">
            <Badge tone={isComingSoon ? "warning" : "success"}>
              {isComingSoon ? "Coming Soon" : "Now Showing"}
            </Badge>
          </div>

          <button
            type="button"
            onClick={handleToggleFavourite}
            aria-label={favourited ? `Remove ${movie.title} from favourites` : `Add ${movie.title} to favourites`}
            aria-pressed={favourited}
            className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <Heart className={`h-4 w-4 ${favourited ? "fill-accent text-accent" : ""}`} aria-hidden="true" />
          </button>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setTrailerOpen(true)}
              aria-label={`Watch trailer for ${movie.title}`}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              <Play className="h-5 w-5" aria-hidden="true" />
            </button>

            {!isComingSoon && (
              <Link
                to={`/booking?movie=${movie.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
                Book Tickets
              </Link>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-1 flex-col gap-1">
          <h3 className="line-clamp-1 font-semibold">
            <Link to={`/movies/${movie.id}`} className="text-text-primary transition-colors hover:text-accent-text">
              {movie.title}
            </Link>
          </h3>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Rating value={movie.rating} size="sm" />
            <span aria-hidden="true">·</span>
            <span>{formatDuration(movie.duration)}</span>
          </div>
          <p className="line-clamp-1 text-xs text-text-muted">{movie.genres.join(" • ")}</p>
        </div>
      </div>

      <TrailerModal movie={movie} open={trailerOpen} onClose={() => setTrailerOpen(false)} />
    </>
  );
}
