import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Pencil, Ban, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import FilterDropdown from "../components/FilterDropdown";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import ShowtimeForm from "../components/ShowtimeForm";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { usePagination } from "../lib/usePagination";
import { useToast } from "../../context/ToastContext";
import { canDeleteShowtime, isShowtimeInPast } from "../lib/businessRules";
import { movies } from "../data/movies";
import { cinemas } from "../data/cinemas";
import { listShowtimes, createShowtime, updateShowtime, cancelShowtime, deleteShowtime, SHOWTIME_STATUSES } from "../services/showtimeService";

const STATUS_OPTIONS = [{ value: "all", label: "All statuses" }, ...SHOWTIME_STATUSES.map((s) => ({ value: s, label: s }))];
const MOVIE_OPTIONS = [{ value: "all", label: "All movies" }, ...movies.map((m) => ({ value: m.id, label: m.title }))];
const CINEMA_OPTIONS = [{ value: "all", label: "All cinemas" }, ...cinemas.map((c) => ({ value: c.id, label: c.name }))];

export default function AdminShowtimes() {
  const { showToast } = useToast();

  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movieFilter, setMovieFilter] = useState("all");
  const [cinemaFilter, setCinemaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [saving, setSaving] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await listShowtimes();
    setShowtimes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    let result = showtimes;
    if (movieFilter !== "all") result = result.filter((s) => s.movieId === movieFilter);
    if (cinemaFilter !== "all") result = result.filter((s) => s.cinemaId === cinemaFilter);
    if (statusFilter !== "all") result = result.filter((s) => s.status === statusFilter);
    return [...result].sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  }, [showtimes, movieFilter, cinemaFilter, statusFilter]);

  const { page, setPage, pageCount, pageItems, totalItems, pageSize } = usePagination(filtered, 10);

  function openCreate() {
    setEditingShowtime(null);
    setFormOpen(true);
  }

  function openEdit(showtime) {
    setEditingShowtime(showtime);
    setFormOpen(true);
  }

  async function handleSubmit(data) {
    setSaving(true);
    try {
      if (editingShowtime) {
        await updateShowtime(editingShowtime.id, data);
        showToast("Showtime updated.");
      } else {
        await createShowtime(data);
        showToast("Showtime scheduled.");
      }
      setFormOpen(false);
      await refresh();
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmCancel() {
    setCanceling(true);
    try {
      await cancelShowtime(cancelTarget.id);
      showToast("Showtime cancelled.");
      setCancelTarget(null);
      await refresh();
    } catch (err) {
      showToast(err.message);
    } finally {
      setCanceling(false);
    }
  }

  function requestDelete(showtime) {
    const { allowed, reason } = canDeleteShowtime(showtime.id);
    setDeleteTarget({ showtime, allowed, reason });
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteShowtime(deleteTarget.showtime.id);
      showToast("Showtime deleted.");
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      showToast(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: "movie",
      header: "Movie",
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <img src={s.movie?.poster} alt="" className="h-10 w-7 shrink-0 rounded object-cover" />
          <span className="max-w-[160px] truncate font-medium text-text-primary">{s.movie?.title}</span>
        </div>
      ),
    },
    { key: "cinema", header: "Cinema", render: (s) => s.cinema?.name },
    { key: "screen", header: "Screen", render: (s) => s.screen?.name },
    { key: "date", header: "Date", render: (s) => s.date },
    { key: "time", header: "Time", render: (s) => `${s.startTime} – ${s.endTime}` },
    { key: "price", header: "Price", render: (s) => `$${s.price.toFixed(2)}` },
    {
      key: "occupancy",
      header: "Booked / Total",
      render: (s) => `${s.bookedSeats}/${s.totalSeats} (${s.totalSeats ? Math.round((s.bookedSeats / s.totalSeats) * 100) : 0}%)`,
    },
    { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status} /> },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (s) => {
        const past = isShowtimeInPast(s);
        return (
          <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => openEdit(s)}
              aria-label={`Edit showtime ${s.id}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
            {s.status === "Scheduled" && (
              <button
                type="button"
                onClick={() => setCancelTarget(s)}
                aria-label={`Cancel showtime ${s.id}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-warning/10 hover:text-warning"
              >
                <Ban className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            {!past && (
              <button
                type="button"
                onClick={() => requestDelete(s)}
                aria-label={`Delete showtime ${s.id}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Showtimes"
        description="Schedule screenings and manage the exhibition calendar across every screen."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Add Showtime
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <FilterDropdown label="Movie" value={movieFilter} onChange={setMovieFilter} options={MOVIE_OPTIONS} />
        <FilterDropdown label="Cinema" value={cinemaFilter} onChange={setCinemaFilter} options={CINEMA_OPTIONS} />
        <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
      </div>

      <DataTable
        columns={columns}
        rows={pageItems}
        loading={loading}
        emptyTitle="No showtimes found"
        emptyDescription="Try a different filter, or schedule a new showtime."
      />
      <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} onChange={setPage} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingShowtime ? "Edit showtime" : "Add showtime"} size="lg">
        <ShowtimeForm
          showtime={editingShowtime}
          submitting={saving}
          submitLabel={editingShowtime ? "Save changes" : "Schedule showtime"}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        title="Cancel this showtime?"
        description="Customers with existing bookings for this showtime will need to be refunded. This showtime will no longer accept new bookings."
        confirmLabel="Cancel showtime"
        destructive
        loading={canceling}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this showtime?"
        description="This permanently removes the showtime. This can't be undone."
        confirmLabel="Delete showtime"
        destructive
        loading={deleting}
        blocked={!!deleteTarget && !deleteTarget.allowed}
        blockedReason={deleteTarget?.reason}
      />
    </div>
  );
}
