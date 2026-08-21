import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, Phone, Calendar, Ban, CheckCircle2, Ticket, DollarSign, Heart } from "lucide-react";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import Button from "../../components/ui/Button";
import { useToast } from "../../context/ToastContext";
import { usePagination } from "../lib/usePagination";
import { getCustomer, setCustomerStatus } from "../services/customerService";

export default function AdminCustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomer(id);
      setCustomer(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const { page, setPage, pageCount, pageItems, totalItems, pageSize } = usePagination(customer?.history ?? [], 10);

  async function toggleActive() {
    const nextStatus = customer.status === "Inactive" ? "Active" : "Inactive";
    await setCustomerStatus(id, nextStatus);
    showToast(`${customer.name} marked ${nextStatus}.`);
    await refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
      </div>
    );
  }

  if (notFound || !customer) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface py-16 text-center">
        <p className="font-semibold text-text-primary">Customer not found</p>
        <Link to="/admin/customers" className="mt-3 inline-block text-sm font-semibold text-accent-text hover:underline">
          Back to Customers
        </Link>
      </div>
    );
  }

  const historyColumns = [
    { key: "id", header: "Booking ID", render: (b) => <span className="font-mono text-xs font-semibold text-text-primary">{b.id}</span> },
    { key: "movie", header: "Movie", render: (b) => b.movie?.title },
    { key: "cinema", header: "Cinema", render: (b) => b.cinema?.name },
    { key: "showtime", header: "Showtime", render: (b) => `${b.date}, ${b.startTime}` },
    { key: "seats", header: "Seats", render: (b) => b.seats.join(", ") },
    { key: "amount", header: "Amount", render: (b) => `$${b.amount.toFixed(2)}` },
    { key: "status", header: "Status", render: (b) => <StatusBadge status={b.bookingStatus} /> },
  ];

  return (
    <div>
      <Link to="/admin/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Customers
      </Link>

      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/15 text-lg font-bold text-accent-text">
            {customer.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-text-primary">{customer.name}</h1>
              <StatusBadge status={customer.status} />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {customer.email}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {customer.phone}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> Joined {customer.joinedAt}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="secondary"
          icon={customer.status === "Inactive" ? CheckCircle2 : Ban}
          onClick={toggleActive}
          className={customer.status !== "Inactive" ? "!text-error hover:!bg-error/10" : ""}
        >
          {customer.status === "Inactive" ? "Activate" : "Deactivate"}
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Bookings" value={customer.totalBookings} icon={Ticket} />
        <StatCard label="Total Spent" value={`$${customer.totalSpent.toFixed(2)}`} icon={DollarSign} tone="accent" />
        <StatCard
          label="Favourite Genres"
          value={customer.favouriteGenres.length > 0 ? customer.favouriteGenres.join(", ") : "—"}
          icon={Heart}
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-text-primary">Booking History</h2>
        <DataTable
          columns={historyColumns}
          rows={pageItems}
          onRowClick={(b) => navigate(`/admin/bookings/${b.id}`)}
          emptyTitle="No bookings yet"
          emptyDescription="This customer hasn't made any bookings."
        />
        <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} onChange={setPage} />
      </div>
    </div>
  );
}
