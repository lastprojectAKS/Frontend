import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import OfferForm from "../components/OfferForm";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { usePagination } from "../lib/usePagination";
import { useToast } from "../../context/ToastContext";
import { listOffers, createOffer, updateOffer, deleteOffer } from "../services/offerService";

export default function AdminOffers() {
  const { showToast } = useToast();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await listOffers();
    setOffers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!search.trim()) return offers;
    const q = search.trim().toLowerCase();
    return offers.filter(
      (o) => o.title.toLowerCase().includes(q) || o.code.toLowerCase().includes(q) || o.discount.toLowerCase().includes(q)
    );
  }, [offers, search]);

  const { page, setPage, pageCount, pageItems, totalItems, pageSize } = usePagination(filtered, 8);

  function openCreate() {
    setEditingOffer(null);
    setFormOpen(true);
  }

  function openEdit(offer) {
    setEditingOffer(offer);
    setFormOpen(true);
  }

  async function handleSubmit(data) {
    setSaving(true);
    try {
      if (editingOffer) {
        await updateOffer(editingOffer.id, data);
        showToast(`"${data.title}" updated.`);
      } else {
        await createOffer(data);
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteOffer(deleteTarget.id);
      showToast(`"${deleteTarget.title}" deleted.`);
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
      key: "title",
      header: "Offer",
      render: (o) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent-text">
            <Tag className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="max-w-[260px] truncate font-semibold text-text-primary">{o.title}</p>
            <p className="max-w-[260px] truncate text-xs text-text-muted">{o.description}</p>
          </div>
        </div>
      ),
    },
    { key: "discount", header: "Discount", render: (o) => <span className="font-semibold text-text-primary">{o.discount}</span> },
    { key: "validity", header: "Validity", render: (o) => o.validity },
    { key: "code", header: "Code", render: (o) => <span className="font-mono text-xs text-text-secondary">{o.code}</span> },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (o) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => openEdit(o)}
            aria-label={`Edit ${o.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(o)}
            aria-label={`Delete ${o.title}`}
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
        title="Offers"
        description="Manage the promotions shown on the public Offers page."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Add Offer
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by title, code, or discount..." />
      </div>

      <DataTable
        columns={columns}
        rows={pageItems}
        loading={loading}
        emptyTitle="No offers found"
        emptyDescription="Try a different search term, or add a new offer."
      />
      <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} onChange={setPage} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingOffer ? "Edit offer" : "Add offer"} size="md">
        <OfferForm
          offer={editingOffer}
          submitting={saving}
          submitLabel={editingOffer ? "Save changes" : "Add offer"}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This permanently removes the offer from the public Offers page. This can't be undone."
        confirmLabel="Delete offer"
        destructive
        loading={deleting}
      />
    </div>
  );
}
