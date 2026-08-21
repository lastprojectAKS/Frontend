import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import FilterDropdown from "../components/FilterDropdown";
import RevenueChart from "../components/RevenueChart";
import BookingStatusChart from "../components/BookingStatusChart";
import SimpleBarChart from "../components/SimpleBarChart";
import DataTable from "../components/DataTable";
import { formatCurrency } from "../../lib/format";
import { addDays, startOfMonth, startOfPreviousMonth, endOfPreviousMonth } from "../lib/dateUtils";
import {
  getRevenueSeriesForRange,
  getBookingStatusDistributionForRange,
  getTopMovies,
  getTopCinemas,
  getTopCustomers,
  getScreenOccupancy,
} from "../services/analyticsService";

const TODAY = "2026-08-21";
const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "custom", label: "Custom range" },
];

function computeRange(preset, customStart, customEnd) {
  if (preset === "today") return { start: TODAY, end: TODAY };
  if (preset === "7d") return { start: addDays(TODAY, -6), end: TODAY };
  if (preset === "30d") return { start: addDays(TODAY, -29), end: TODAY };
  if (preset === "this-month") return { start: startOfMonth(TODAY), end: TODAY };
  if (preset === "last-month") return { start: startOfPreviousMonth(TODAY), end: endOfPreviousMonth(TODAY) };
  return { start: customStart || TODAY, end: customEnd || TODAY };
}

export default function AdminReports() {
  const [rangePreset, setRangePreset] = useState("7d");
  const [customStart, setCustomStart] = useState(TODAY);
  const [customEnd, setCustomEnd] = useState(TODAY);

  const { start, end } = useMemo(() => computeRange(rangePreset, customStart, customEnd), [rangePreset, customStart, customEnd]);

  const [loading, setLoading] = useState(true);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [topCinemas, setTopCinemas] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [screenOccupancy, setScreenOccupancy] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      getRevenueSeriesForRange(start, end),
      getBookingStatusDistributionForRange(start, end),
      getTopMovies(5),
      getTopCinemas(5),
      getTopCustomers(5),
      getScreenOccupancy(),
    ]).then(([revenue, statuses, movies, cinemas, customers, occupancy]) => {
      if (cancelled) return;
      setRevenueSeries(revenue);
      setStatusDistribution(statuses);
      setTopMovies(movies);
      setTopCinemas(cinemas);
      setTopCustomers(customers);
      setScreenOccupancy(occupancy);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [start, end]);

  const rangeRevenue = revenueSeries.reduce((sum, d) => sum + d.revenue, 0);
  const rangeBookings = statusDistribution.reduce((sum, d) => sum + d.count, 0);

  const occupancyColumns = [
    { key: "screen", header: "Screen", render: (r) => r.screen.name },
    { key: "cinema", header: "Cinema", render: (r) => r.cinema?.name ?? "—" },
    { key: "capacity", header: "Capacity", render: (r) => r.capacity },
    {
      key: "occupancy",
      header: "Occupancy",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-hover">
            <div className="h-full bg-accent" style={{ width: `${Math.round(r.occupancy * 100)}%` }} />
          </div>
          <span className="text-xs text-text-secondary">{Math.round(r.occupancy * 100)}%</span>
        </div>
      ),
    },
  ];

  if (loading && revenueSeries.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reports & Analytics" description="Performance across revenue, bookings, movies, cinemas, and customers." />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <FilterDropdown label="Date range" value={rangePreset} onChange={setRangePreset} options={RANGE_OPTIONS} />
        {rangePreset === "custom" && (
          <>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              max={customEnd}
              className="h-10 rounded-lg border border-border-strong bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <span className="text-sm text-text-muted">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              min={customStart}
              max={TODAY}
              className="h-10 rounded-lg border border-border-strong bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </>
        )}
        <span className="ml-auto text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">{formatCurrency(rangeRevenue)}</span> revenue ·{" "}
          <span className="font-semibold text-text-primary">{rangeBookings}</span> bookings in this range
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <RevenueChart dailySeries={revenueSeries} />
        <BookingStatusChart data={statusDistribution} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-4 font-semibold text-text-primary">Movie Performance (all-time revenue)</h3>
          <SimpleBarChart
            data={topMovies.map((m) => ({ name: m.movie.title, value: m.revenue }))}
            valueFormatter={(v) => formatCurrency(v)}
          />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-4 font-semibold text-text-primary">Cinema Performance (all-time revenue)</h3>
          <SimpleBarChart
            data={topCinemas.map((c) => ({ name: c.cinema.name, value: c.revenue }))}
            valueFormatter={(v) => formatCurrency(v)}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-4 font-semibold text-text-primary">Top Customers (all-time spend)</h3>
          <SimpleBarChart
            data={topCustomers.map((c) => ({ name: c.customer.name, value: c.totalSpent }))}
            valueFormatter={(v) => formatCurrency(v)}
          />
        </div>
        <div>
          <h3 className="mb-4 font-semibold text-text-primary">Screen Occupancy (all-time)</h3>
          <DataTable columns={occupancyColumns} rows={screenOccupancy} keyField={(r) => r.screen.id} />
        </div>
      </div>
    </div>
  );
}
