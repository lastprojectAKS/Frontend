import { useState, useEffect, useCallback } from "react";
import { ChevronDown, Plus, Pencil, Ban, CheckCircle2, MapPin, Phone, Mail, Loader2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import CinemaForm from "../components/CinemaForm";
import ScreenForm from "../components/ScreenForm";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { useToast } from "../../context/ToastContext";
import { canDeactivateCinema } from "../lib/businessRules";
import {
  listCinemas,
  createCinema,
  updateCinema,
  listScreens,
  createScreen,
  updateScreen,
} from "../services/cinemaService";

function ScreenCard({ screen, onEdit, onToggleActive }) {
  const capacity = screen.capacity;
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-text-primary">{screen.name}</p>
          <p className="text-xs text-text-muted">
            {screen.type} • {capacity} seats
          </p>
        </div>
        <StatusBadge status={screen.status} />
      </div>

      <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-surface-hover">
        {screen.seatCategories.map((c) => (
          <div
            key={c.name}
            className={c.name === "Standard" ? "bg-accent" : c.name === "Premium" ? "bg-warning" : "bg-success"}
            style={{ width: `${capacity > 0 ? (c.count / capacity) * 100 : 0}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted">
        {screen.seatCategories.map((c) => (
          <span key={c.name}>
            {c.name}: {c.count}
          </span>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(screen)}
          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-strong text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onToggleActive(screen)}
          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-strong text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          {screen.status === "Inactive" ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Activate
            </>
          ) : (
            <>
              <Ban className="h-3.5 w-3.5" aria-hidden="true" /> Deactivate
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function CinemaCard({ cinema, expanded, onToggleExpand, onEdit, onDeactivateRequest, onActivate, onAddScreen, onEditScreen, onToggleScreenActive }) {
  const [screens, setScreens] = useState(null);

  const loadScreens = useCallback(async () => {
    const data = await listScreens(cinema.id);
    setScreens(data);
  }, [cinema.id]);

  useEffect(() => {
    if (expanded && screens === null) loadScreens();
  }, [expanded, screens, loadScreens]);

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <button type="button" onClick={onToggleExpand} className="flex flex-1 items-start gap-3 text-left">
          <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform ${expanded ? "" : "-rotate-90"}`} aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-text-primary">{cinema.name}</h3>
              <StatusBadge status={cinema.status} />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {cinema.address}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3 w-3" aria-hidden="true" /> {cinema.phone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3 w-3" aria-hidden="true" /> {cinema.email}
              </span>
              <span>{cinema.screenCount} screens</span>
            </div>
          </div>
        </button>

        <div className="flex shrink-0 gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="secondary" icon={Pencil} onClick={() => onEdit(cinema)}>
            Edit
          </Button>
          {cinema.status === "Inactive" ? (
            <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={() => onActivate(cinema)}>
              Activate
            </Button>
          ) : (
            <Button size="sm" variant="secondary" icon={Ban} onClick={() => onDeactivateRequest(cinema)}>
              Deactivate
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary">Screens</p>
            <Button size="sm" icon={Plus} onClick={() => onAddScreen(cinema)}>
              Add Screen
            </Button>
          </div>

          {screens === null ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-text-muted" aria-hidden="true" />
            </div>
          ) : screens.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-secondary">No screens yet. Add one to start scheduling showtimes here.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {screens.map((s) => (
                <ScreenCard key={s.id} screen={s} onEdit={onEditScreen} onToggleActive={(screen) => onToggleScreenActive(cinema, screen)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminCinemas() {
  const { showToast } = useToast();
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [cinemaFormOpen, setCinemaFormOpen] = useState(false);
  const [editingCinema, setEditingCinema] = useState(null);
  const [savingCinema, setSavingCinema] = useState(false);

  const [screenFormOpen, setScreenFormOpen] = useState(false);
  const [screenCinemaId, setScreenCinemaId] = useState(null);
  const [editingScreen, setEditingScreen] = useState(null);
  const [savingScreen, setSavingScreen] = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await listCinemas();
    setCinemas(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function bumpScreens() {
    setRefreshTick((t) => t + 1);
  }

  function openCreateCinema() {
    setEditingCinema(null);
    setCinemaFormOpen(true);
  }

  function openEditCinema(cinema) {
    setEditingCinema(cinema);
    setCinemaFormOpen(true);
  }

  async function handleCinemaSubmit(data) {
    setSavingCinema(true);
    try {
      if (editingCinema) {
        await updateCinema(editingCinema.id, data);
        showToast(`"${data.name}" updated.`);
      } else {
        await createCinema(data);
        showToast(`"${data.name}" added.`);
      }
      setCinemaFormOpen(false);
      await refresh();
    } catch (err) {
      showToast(err.message);
    } finally {
      setSavingCinema(false);
    }
  }

  async function activateCinema(cinema) {
    await updateCinema(cinema.id, { status: "Active" });
    showToast(`"${cinema.name}" activated.`);
    await refresh();
  }

  function requestDeactivate(cinema) {
    const { warning } = canDeactivateCinema(cinema.id);
    setDeactivateTarget({ cinema, warning });
  }

  async function confirmDeactivate() {
    const cinema = deactivateTarget.cinema;
    await updateCinema(cinema.id, { status: "Inactive" });
    showToast(`"${cinema.name}" deactivated.`);
    setDeactivateTarget(null);
    await refresh();
  }

  function openAddScreen(cinema) {
    setScreenCinemaId(cinema.id);
    setEditingScreen(null);
    setScreenFormOpen(true);
  }

  function openEditScreen(screen) {
    setScreenCinemaId(screen.cinemaId);
    setEditingScreen(screen);
    setScreenFormOpen(true);
  }

  async function handleScreenSubmit(data) {
    setSavingScreen(true);
    try {
      if (editingScreen) {
        await updateScreen(editingScreen.id, data);
        showToast(`"${data.name}" updated.`);
      } else {
        await createScreen({ ...data, cinemaId: screenCinemaId });
        showToast(`"${data.name}" added.`);
      }
      setScreenFormOpen(false);
      bumpScreens();
      await refresh();
    } catch (err) {
      showToast(err.message);
    } finally {
      setSavingScreen(false);
    }
  }

  async function toggleScreenActive(cinema, screen) {
    const nextStatus = screen.status === "Inactive" ? "Active" : "Inactive";
    await updateScreen(screen.id, { status: nextStatus });
    showToast(`"${screen.name}" marked ${nextStatus}.`);
    bumpScreens();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Cinemas & Screens"
        description="Manage cinema locations and the screens available for scheduling."
        actions={
          <Button icon={Plus} onClick={openCreateCinema}>
            Add Cinema
          </Button>
        }
      />

      <div className="flex flex-col gap-4" key={refreshTick}>
        {cinemas.map((cinema) => (
          <CinemaCard
            key={cinema.id}
            cinema={cinema}
            expanded={expandedId === cinema.id}
            onToggleExpand={() => setExpandedId((id) => (id === cinema.id ? null : cinema.id))}
            onEdit={openEditCinema}
            onActivate={activateCinema}
            onDeactivateRequest={requestDeactivate}
            onAddScreen={openAddScreen}
            onEditScreen={openEditScreen}
            onToggleScreenActive={toggleScreenActive}
          />
        ))}
      </div>

      <Modal open={cinemaFormOpen} onClose={() => setCinemaFormOpen(false)} title={editingCinema ? "Edit cinema" : "Add cinema"} size="md">
        <CinemaForm
          cinema={editingCinema}
          submitting={savingCinema}
          submitLabel={editingCinema ? "Save changes" : "Add cinema"}
          onCancel={() => setCinemaFormOpen(false)}
          onSubmit={handleCinemaSubmit}
        />
      </Modal>

      <Modal open={screenFormOpen} onClose={() => setScreenFormOpen(false)} title={editingScreen ? "Edit screen" : "Add screen"} size="md">
        <ScreenForm
          screen={editingScreen}
          submitting={savingScreen}
          submitLabel={editingScreen ? "Save changes" : "Add screen"}
          onCancel={() => setScreenFormOpen(false)}
          onSubmit={handleScreenSubmit}
        />
      </Modal>

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={confirmDeactivate}
        title={`Deactivate "${deactivateTarget?.cinema.name}"?`}
        description={deactivateTarget?.warning ?? "This cinema will be hidden from customers. Existing showtimes and bookings are preserved."}
        confirmLabel="Deactivate"
        destructive
      />
    </div>
  );
}
