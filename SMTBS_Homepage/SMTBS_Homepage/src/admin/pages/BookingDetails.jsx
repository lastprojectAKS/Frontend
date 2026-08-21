import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Ban, RotateCcw, Printer, Loader2, User, Film, Building2, CalendarClock, Armchair, DollarSign } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import Button from "../../components/ui/Button";
import { useToast } from "../../context/ToastContext";
import { canCancelBooking } from "../lib/businessRules";
import { getBooking, cancelBooking, refundBooking } from "../services/bookingService";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-text-secondary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="truncate font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}

export default function AdminBookingDetails() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [cancelState, setCancelState] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBooking(id);
      setBooking(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function requestCancel() {
    const { allowed, reason } = canCancelBooking(booking);
    setCancelState({ allowed, reason });
  }

  async function confirmCancel() {
    setCanceling(true);
    try {
      await cancelBooking(id);
      showToast(`Booking ${id} cancelled.`);
      setCancelState(null);
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
      await refundBooking(id);
      showToast(`Booking ${id} refunded.`);
      setRefundOpen(false);
      await refresh();
    } catch (err) {
      showToast(err.message);
    } finally {
      setRefunding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
      </div>
    );
  }

  if (notFound || !booking) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface py-16 text-center">
        <p className="font-semibold text-text-primary">Booking not found</p>
        <Link to="/admin/bookings" className="mt-3 inline-block text-sm font-semibold text-accent-text hover:underline">
          Back to Bookings
        </Link>
      </div>
    );
  }

  const canRefund = booking.paymentStatus === "Paid" && booking.bookingStatus !== "Refunded";
  const canCancel = booking.bookingStatus === "Confirmed" || booking.bookingStatus === "Pending";

  return (
    <div>
      <Link to="/admin/bookings" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Bookings
      </Link>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-text-muted">{booking.id}</p>
            <h1 className="mt-1 text-2xl font-bold text-text-primary">{booking.movie?.title}</h1>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={booking.paymentStatus} />
            <StatusBadge status={booking.bookingStatus} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow icon={User} label="Customer" value={booking.customer?.name ?? "—"} />
          <InfoRow icon={Film} label="Movie" value={booking.movie?.title} />
          <InfoRow icon={Building2} label="Cinema / Screen" value={`${booking.cinema?.name} · ${booking.screen?.name}`} />
          <InfoRow icon={CalendarClock} label="Showtime" value={`${booking.date} at ${booking.startTime}`} />
          <InfoRow icon={Armchair} label="Seats" value={booking.seats.join(", ")} />
          <InfoRow icon={DollarSign} label="Amount paid" value={`$${booking.amount.toFixed(2)}`} />
        </div>

        <div className="mt-6 border-t border-border pt-4 text-sm text-text-secondary">
          <p>
            Booked on {new Date(booking.createdAt).toLocaleString()} · {booking.customer?.email}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button size="sm" variant="secondary" icon={Printer} onClick={() => showToast("Ticket printing isn't available in this demo.")}>
            Print / Download Ticket
          </Button>
          {canRefund && (
            <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => setRefundOpen(true)}>
              Refund
            </Button>
          )}
          {canCancel && (
            <Button size="sm" variant="secondary" icon={Ban} className="!text-error hover:!bg-error/10" onClick={requestCancel}>
              Cancel Booking
            </Button>
          )}
          {booking.customer?.id && (
            <Button size="sm" variant="secondary" to={`/admin/customers/${booking.customer.id}`}>
              View Customer
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!cancelState}
        onClose={() => setCancelState(null)}
        onConfirm={confirmCancel}
        title={`Cancel booking ${booking.id}?`}
        description={`This will cancel ${booking.customer?.name}'s booking and free up ${booking.seats.length} seat(s). This can't be undone.`}
        confirmLabel="Cancel booking"
        destructive
        loading={canceling}
        blocked={!!cancelState && !cancelState.allowed}
        blockedReason={cancelState?.reason}
      />

      <ConfirmDialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        onConfirm={confirmRefund}
        title={`Refund booking ${booking.id}?`}
        description="This marks the payment as refunded and cancels the booking, freeing up the seats."
        confirmLabel="Refund booking"
        destructive
        loading={refunding}
      />
    </div>
  );
}
