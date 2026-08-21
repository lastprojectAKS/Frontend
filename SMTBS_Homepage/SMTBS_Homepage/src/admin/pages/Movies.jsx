import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Ban, CheckCircle2, Star } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import FilterDropdown from "../components/FilterDropdown";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import MovieForm from "../components/MovieForm";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { usePagination } from "../lib/usePagination";
import { useToast } from "../../context/ToastContext";
import { canDeleteMovie } from "../lib/businessRules";
import { PLACEHOLDER_POSTER } from "../lib/placeholder";
import { listMovies, createMovie, updateMovie, deleteMovie, setMovieStatus, MOVIE_STATUSES } from "../services/movieService";

const STATUS_OPTIONS = [{ value: "all", label: "All statuses" }, ...MOVIE_STATUSES.map((s) => ({ value: s, label: s }))];
const SORT_OPTIONS = [
  { value: "title-asc", label: "Title (A-Z)" },
  { value: "release-desc", label: "Release date (newest)" },
  { value: "rating-desc", label: "Rating (highest)" },
];

export default function AdminMovies() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("title-asc");

  const [formOpen, setFormOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await listMovies();
    setMovies(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    let result = movies;
    if (status !== "all") result = result.filter((m) => m.status === status);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (m) => m.title.toLowerCase().includes(q) || m.director.toLowerCase().includes(q) || m.genres.some((g) => g.toLowerCase().includes(q))
      );
    }
    const sorted = [...result];
    if (sort === "title-asc") sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "release-desc") sorted.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
    if (sort === "rating-desc") sorted.sort((a, b) => b.rating - a.rating);
    return sorted;
  }, [movies, status, search, sort]);

  const { page, setPage, pageCount, pageItems, totalItems, pageSize } = usePagination(filtered, 8);

  function openCreate() {
    setEditingMovie(null);
    setFormOpen(true);
  }

  function openEdit(movie) {
    setEditingMovie(movie);
    setFormOpen(true);
  }

  async function handleSubmit(data) {
    setSaving(true);
    try {
      if (editingMovie) {
        await updateMovie(editingMovie.id, data);
        showToast(`"${data.title}" updated.`);
      } else {
        await createMovie(data);
        showToast(`"${data.title}" added.`);
      }
      setFormOpen(false);
      await refresh();
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(movie) {
    const { allowed, reason } = canDeleteMovie(movie.id);
    setDeleteTarget({ movie, allowed, reason });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMovie(deleteTarget.movie.id);
      showToast(`"${deleteTarget.movie.title}" deleted.`);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      showToast(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(movie) {
    const nextStatus = movie.status === "Inactive" ? "Now Showing" : "Inactive";
    await setMovieStatus(movie.id, nextStatus);
    showToast(`"${movie.title}" marked ${nextStatus}.`);
    await refresh();
  }

  const columns = [
    {
      key: "title",
      header: "Movie",
      render: (m) => (
        <div className="flex items-center gap-3">
          <img
            src={m.poster}
            alt=""
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = PLACEHOLDER_POSTER;
            }}
            className="h-14 w-10 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0">
            <p className="max-w-[220px] truncate font-semibold text-text-primary">{m.title}</p>
            <p className="truncate text-xs text-text-muted">{m.genres.join(", ")}</p>
          </div>
        </div>
      ),
    },
    { key: "duration", header: "Runtime", render: (m) => `${m.duration} min` },
    { key: "releaseDate", header: "Release", render: (m) => m.releaseDate },
    {
      key: "rating",
      header: "Rating",
      render: (m) => (
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
          {m.rating.toFixed(1)}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (m) => <StatusBadge status={m.status} /> },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (m) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => openEdit(m)}
            aria-label={`Edit ${m.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => toggleActive(m)}
            aria-label={m.status === "Inactive" ? `Activate ${m.title}` : `Deactivate ${m.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            {m.status === "Inactive" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Ban className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => requestDelete(m)}
            aria-label={`Delete ${m.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Movies"
        description="Manage your catalog — add titles, update showings, and retire ended runs."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Add Movie
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by title, director, genre..." />
        <FilterDropdown label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <FilterDropdown label="Sort" value={sort} onChange={setSort} options={SORT_OPTIONS} />
      </div>

      <DataTable
        columns={columns}
        rows={pageItems}
        loading={loading}
        emptyTitle="No movies found"
        emptyDescription="Try a different search term or filter, or add a new movie to the catalog."
        onRowClick={(m) => navigate(`/admin/movies/${m.id}`)}
      />
      <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} onChange={setPage} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingMovie ? "Edit movie" : "Add movie"} size="lg">
        <MovieForm
          movie={editingMovie}
          submitting={saving}
          submitLabel={editingMovie ? "Save changes" : "Add movie"}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete "${deleteTarget?.movie.title}"?`}
        description="This permanently removes the movie from the catalog. This can't be undone."
        confirmLabel="Delete movie"
        destructive
        loading={deleting}
        blocked={!!deleteTarget && !deleteTarget.allowed}
        blockedReason={deleteTarget?.reason}
      />
    </div>
  );
}
