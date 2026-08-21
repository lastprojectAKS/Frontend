import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Pencil, Ban, CheckCircle2, Trash2, Loader2, Ticket, DollarSign, Gauge, CalendarClock, Star } from "lucide-react";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import MovieForm from "../components/MovieForm";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { useToast } from "../../context/ToastContext";
import { canDeleteMovie } from "../lib/businessRules";
import { PLACEHOLDER_POSTER } from "../lib/placeholder";
import { getMovie, updateMovie, deleteMovie, setMovieStatus } from "../services/movieService";
import { getMovieStats } from "../services/analyticsService";
import { listShowtimes } from "../services/showtimeService";

export default function AdminMovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [movie, setMovie] = useState(null);
  const [stats, setStats] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteState, setDeleteState] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [m, s, allShowtimes] = await Promise.all([getMovie(id), getMovieStats(id), listShowtimes()]);
      setMovie(m);
      setStats(s);
      setShowtimes(allShowtimes.filter((st) => st.movieId === id).sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime)));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleSubmit(data) {
    setSaving(true);
    try {
      await updateMovie(id, data);
      showToast(`"${data.title}" updated.`);
      setEditOpen(false);
      await refresh();
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    const nextStatus = movie.status === "Inactive" ? "Now Showing" : "Inactive";
    await setMovieStatus(id, nextStatus);
    showToast(`"${movie.title}" marked ${nextStatus}.`);
    await refresh();
  }

  function requestDelete() {
    const { allowed, reason } = canDeleteMovie(id);
    setDeleteState({ allowed, reason });
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteMovie(id);
      showToast(`"${movie.title}" deleted.`);
      navigate("/admin/movies");
    } catch (err) {
      showToast(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
      </div>
    );
  }

  if (notFound || !movie) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface py-16 text-center">
        <p className="font-semibold text-text-primary">Movie not found</p>
        <Link to="/admin/movies" className="mt-3 inline-block text-sm font-semibold text-accent-text hover:underline">
          Back to Movies
        </Link>
      </div>
    );
  }

  const showtimeColumns = [
    { key: "cinema", header: "Cinema", render: (s) => s.cinema?.name ?? "—" },
    { key: "screen", header: "Screen", render: (s) => s.screen?.name ?? "—" },
    { key: "date", header: "Date", render: (s) => s.date },
    { key: "time", header: "Time", render: (s) => `${s.startTime} – ${s.endTime}` },
    {
      key: "occupancy",
      header: "Occupancy",
      render: (s) => `${s.bookedSeats}/${s.totalSeats} (${Math.round((s.bookedSeats / s.totalSeats) * 100)}%)`,
    },
    { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status} /> },
  ];

  return (
    <div>
      <Link to="/admin/movies" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Movies
      </Link>

      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 sm:flex-row">
        <img
          src={movie.poster}
          alt=""
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = PLACEHOLDER_POSTER;
          }}
          className="h-56 w-40 shrink-0 self-center rounded-xl object-cover sm:self-start"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-text-primary">{movie.title}</h1>
            <StatusBadge status={movie.status} />
          </div>
          <p className="mt-1 text-sm text-text-secondary">{movie.genres.join(" • ")}</p>

          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <p className="text-text-secondary">
              <span className="text-text-muted">Director</span> <br /> {movie.director}
            </p>
            <p className="text-text-secondary">
              <span className="text-text-muted">Runtime</span> <br /> {movie.duration} min
            </p>
            <p className="text-text-secondary">
              <span className="text-text-muted">Rating</span> <br />
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
                {movie.rating.toFixed(1)}
              </span>
            </p>
            <p className="text-text-secondary">
              <span className="text-text-muted">Language</span> <br /> {movie.language}
            </p>
            <p className="text-text-secondary">
              <span className="text-text-muted">Age rating</span> <br /> {movie.ageRating}
            </p>
            <p className="text-text-secondary">
              <span className="text-text-muted">Release – End</span> <br /> {movie.releaseDate} – {movie.endDate}
            </p>
          </div>

          {movie.cast?.length > 0 && (
            <p className="mt-3 text-sm text-text-secondary">
              <span className="text-text-muted">Cast</span> {movie.cast.join(", ")}
            </p>
          )}

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">{movie.description}</p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button size="sm" icon={Pencil} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button size="sm" variant="secondary" icon={movie.status === "Inactive" ? CheckCircle2 : Ban} onClick={toggleActive}>
              {movie.status === "Inactive" ? "Activate" : "Deactivate"}
            </Button>
            <Button size="sm" variant="secondary" icon={Trash2} className="!text-error hover:!bg-error/10" onClick={requestDelete}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tickets Sold" value={stats.ticketsSold.toLocaleString()} icon={Ticket} />
        <StatCard label="Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={DollarSign} tone="accent" />
        <StatCard label="Occupancy" value={`${Math.round(stats.occupancy * 100)}%`} icon={Gauge} />
        <StatCard label="Showtimes" value={stats.showtimeCount} icon={CalendarClock} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-text-primary">Showtimes</h2>
        <DataTable
          columns={showtimeColumns}
          rows={showtimes}
          keyField="id"
          emptyTitle="No showtimes scheduled"
          emptyDescription="This movie has no showtimes yet. Schedule one from the Showtimes page."
        />
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit movie" size="lg">
        <MovieForm movie={movie} submitting={saving} submitLabel="Save changes" onCancel={() => setEditOpen(false)} onSubmit={handleSubmit} />
      </Modal>

      <ConfirmDialog
        open={!!deleteState}
        onClose={() => setDeleteState(null)}
        onConfirm={confirmDelete}
        title={`Delete "${movie.title}"?`}
        description="This permanently removes the movie from the catalog. This can't be undone."
        confirmLabel="Delete movie"
        destructive
        loading={deleting}
        blocked={!!deleteState && !deleteState.allowed}
        blockedReason={deleteState?.reason}
      />
    </div>
  );
}
