import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Ban, CheckCircle2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import FilterDropdown from "../components/FilterDropdown";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";
import { usePagination } from "../lib/usePagination";
import { useToast } from "../../context/ToastContext";
import { listCustomers, setCustomerStatus } from "../services/customerService";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];
const SORT_OPTIONS = [
  { value: "spend-desc", label: "Total spend (highest)" },
  { value: "bookings-desc", label: "Bookings (most)" },
  { value: "name-asc", label: "Name (A-Z)" },
];

export default function AdminCustomers() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("spend-desc");

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await listCustomers();
    setCustomers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    let result = customers;
    if (status !== "all") result = result.filter((c) => c.status === status);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    const sorted = [...result];
    if (sort === "spend-desc") sorted.sort((a, b) => b.totalSpent - a.totalSpent);
    if (sort === "bookings-desc") sorted.sort((a, b) => b.totalBookings - a.totalBookings);
    if (sort === "name-asc") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [customers, status, search, sort]);

  const { page, setPage, pageCount, pageItems, totalItems, pageSize } = usePagination(filtered, 10);

  async function toggleActive(customer) {
    const nextStatus = customer.status === "Inactive" ? "Active" : "Inactive";
    await setCustomerStatus(customer.id, nextStatus);
    showToast(`${customer.name} marked ${nextStatus}.`);
    await refresh();
  }

  const columns = [
    {
      key: "name",
      header: "Customer",
      render: (c) => (
        <div>
          <p className="font-semibold text-text-primary">{c.name}</p>
          <p className="text-xs text-text-muted">{c.email}</p>
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (c) => c.phone },
    { key: "bookings", header: "Bookings", render: (c) => c.totalBookings },
    { key: "spend", header: "Total Spend", render: (c) => `$${c.totalSpent.toFixed(2)}` },
    { key: "joined", header: "Joined", render: (c) => c.joinedAt },
    { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} /> },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (c) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => toggleActive(c)}
            aria-label={c.status === "Inactive" ? `Activate ${c.name}` : `Deactivate ${c.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            {c.status === "Inactive" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Ban className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Customers" description="Everyone who has booked with you — spending, activity, and preferences." />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />
        <FilterDropdown label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <FilterDropdown label="Sort" value={sort} onChange={setSort} options={SORT_OPTIONS} />
      </div>

      <DataTable
        columns={columns}
        rows={pageItems}
        loading={loading}
        emptyTitle="No customers found"
        emptyDescription="Try a different search term or filter."
        onRowClick={(c) => navigate(`/admin/customers/${c.id}`)}
      />
      <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} onChange={setPage} />
    </div>
  );
}
