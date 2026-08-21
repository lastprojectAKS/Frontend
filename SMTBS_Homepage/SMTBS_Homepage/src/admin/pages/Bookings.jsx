import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Ban, RotateCcw } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import FilterDropdown from "../components/FilterDropdown";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import { usePagination } from "../lib/usePagination";
import { useToast } from "../../context/ToastContext";
import { canCancelBooking } from "../lib/businessRules";
import { listBookings, cancelBooking, refundBooking, BOOKING_STATUSES, PAYMENT_STATUSES } from "../services/bookingService";

const STATUS_OPTIONS = [{ value: "all", label: "All statuses" }, ...BOOKING_STATUSES.map((s) => ({ value: s, label: s }))];
const PAYMENT_OPTIONS = [{ value: "all", label: "All payments" }, ...PAYMENT_STATUSES.map((s) => ({ value: s, label: s }))];

export default function AdminBookings() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");

  const [cancelTarget, setCancelTarget] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refunding, setRefunding] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await listBookings();
    setBookings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    let result = bookings;
    if (status !== "all") result = result.filter((b) => b.bookingStatus === status);
    if (payment !== "all") result = result.filter((b) => b.paymentStatus === payment);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.customer?.name.toLowerCase().includes(q) ||
          b.movie?.title.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [bookings, status, payment, search]);

  const { page, setPage, pageCount, pageItems, totalItems, pageSize } = usePagination(filtered, 10);

  function requestCancel(booking) {
    const { allowed, reason } = canCancelBooking(booking);
    setCancelTarget({ booking, allowed, reason });
  }

  async function confirmCancel() {
    setCanceling(true);
    try {
      await cancelBooking(cancelTarget.booking.id);
      showToast(`Booking ${cancelTarget.booking.id} cancelled.`);
      setCancelTarget(null);
      await refresh();
    } catch (err) {
      showToast(err.message);
    } finally {
      setCanceling(false);
    }
  }

  async function confirmRefund() {
    setRefunding(true);
    try {
      await refundBooking(refundTarget.id);
      showToast(`Booking ${refundTarget.id} refunded.`);
      setRefundTarget(null);
      await refresh();
    } catch (err) {
      showToast(err.message);
    } finally {
      setRefunding(false);
    }
  }

  const columns = [
    { key: "id", header: "Booking ID", render: (b) => <span className="font-mono text-xs font-semibold text-text-primary">{b.id}</span> },
    { key: "customer", header: "Customer", render: (b) => b.customer?.name ?? "—" },
    { key: "movie", header: "Movie", render: (b) => <span className="max-w-[160px] truncate">{b.movie?.title}</span> },
    { key: "cinema", header: "Cinema", render: (b) => b.cinema?.name },
    { key: "showtime", header: "Showtime", render: (b) => `${b.date}, ${b.startTime}` },
    { key: "seats", header: "Seats", render: (b) => b.seats.join(", ") },
    { key: "amount", header: "Amount", render: (b) => `$${b.amount.toFixed(2)}` },
    { key: "payment", header: "Payment", render: (b) => <StatusBadge status={b.paymentStatus} /> },
    { key: "status", header: "Status", render: (b) => <StatusBadge status={b.bookingStatus} /> },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (b) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/admin/bookings/${b.id}`)}
            aria-label={`View booking ${b.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </button>
          {b.paymentStatus === "Paid" && b.bookingStatus !== "Refunded" && (
            <button
              type="button"
              onClick={() => setRefundTarget(b)}
              aria-label={`Refund booking ${b.id}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent-text"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {(b.bookingStatus === "Confirmed" || b.bookingStatus === "Pending") && (
            <button
              type="button"
              onClick={() => requestCancel(b)}
              aria-label={`Cancel booking ${b.id}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
            >
              <Ban className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Bookings" description="Every ticket sold across your cinemas — search, review, and manage bookings." />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by booking ID, customer, movie..." />
        <FilterDropdown label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <FilterDropdown label="Payment" value={payment} onChange={setPayment} options={PAYMENT_OPTIONS} />
      </div>

      <DataTable
        columns={columns}
        rows={pageItems}
        loading={loading}
        emptyTitle="No bookings found"
        emptyDescription="Try a different search term or filter."
        onRowClick={(b) => navigate(`/admin/bookings/${b.id}`)}
      />
      <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} onChange={setPage} />

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        title={`Cancel booking ${cancelTarget?.booking.id}?`}
        description={`This will cancel ${cancelTarget?.booking.customer?.name}'s booking for "${cancelTarget?.booking.movie?.title}" and free up their ${cancelTarget?.booking.seats.length} seat(s). This can't be undone.`}
        confirmLabel="Cancel booking"
        destructive
        loading={canceling}
        blocked={!!cancelTarget && !cancelTarget.allowed}
        blockedReason={cancelTarget?.reason}
      />

      <ConfirmDialog
        open={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        onConfirm={confirmRefund}
        title={`Refund booking ${refundTarget?.id}?`}
        description="This marks the payment as refunded and cancels the booking, freeing up the seats."
        confirmLabel="Refund booking"
        destructive
        loading={refunding}
      />
    </div>
  );
}
