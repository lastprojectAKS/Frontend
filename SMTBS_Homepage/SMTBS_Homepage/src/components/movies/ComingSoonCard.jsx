import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BellRing } from "lucide-react";
import Rating from "../ui/Rating";
import { formatDate } from "../../lib/format";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { hasReleaseAlert, setReleaseAlert } from "../../services/releaseAlertService";

export default function ComingSoonCard({ movie }) {
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifying(false);
      return;
    }
    let cancelled = false;
    hasReleaseAlert(user.id, movie.id).then((on) => {
      if (!cancelled) setNotifying(on);
    });
    return () => {
      cancelled = true;
    };
  }, [user, movie.id]);

  async function toggleAlert() {
    if (!user) {
      openAuthModal("login");
      return;
    }
    const next = !notifying;
    setNotifying(next);
    try {
      await setReleaseAlert(user.id, movie.id, next);
    } catch {
      setNotifying(!next);
      showToast("Couldn't save your alert. Please try again.");
    }
  }

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
          onClick={toggleAlert}
          aria-pressed={notifying}
          className={`mt-auto inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            notifying
              ? "bg-accent/15 text-accent-text"
              : "bg-bg-secondary text-text-secondary hover:text-text-primary"
          }`}
        >
          {notifying ? <BellRing className="h-3.5 w-3.5" aria-hidden="true" /> : <Bell className="h-3.5 w-3.5" aria-hidden="true" />}
          {notifying ? "Alert set" : "Notify Me"}
        </button>
      </div>
    </div>
  );
}
