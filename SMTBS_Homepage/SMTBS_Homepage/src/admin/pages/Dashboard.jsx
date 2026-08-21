import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DollarSign, Ticket, Users, Film, TrendingUp, CalendarClock, Gauge, Loader2 } from "lucide-react";
import StatCard from "../components/StatCard";
import RevenueChart from "../components/RevenueChart";
import BookingStatusChart from "../components/BookingStatusChart";
import StatusBadge from "../components/StatusBadge";
import DataTable from "../components/DataTable";
import { useAdminAuth } from "../context/AdminAuthContext";
import {
  getDashboardSummary,
  getRevenueSeries,
  getBookingStatusDistribution,
  getTopMovies,
  getRecentBookings,
  getUpcomingShows,
} from "../services/analyticsService";
import { formatCurrency, formatDate } from "../../lib/format";

export default function Dashboard() {
  const { admin } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [upcomingShows, setUpcomingShows] = useState([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getDashboardSummary(),
      getRevenueSeries(14),
      getBookingStatusDistribution(),
      getTopMovies(5),
      getRecentBookings(8),
      getUpcomingShows(6),
    ]).then(([summaryRes, revenueRes, statusRes, moviesRes, bookingsRes, showsRes]) => {
      if (cancelled) return;
      setSummary(summaryRes);
      setRevenueSeries(revenueRes);
      setStatusDistribution(statusRes);
      setTopMovies(moviesRes);
      setRecentBookings(bookingsRes);
      setUpcomingShows(showsRes);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Loading dashboard...</p>
      </div>
    );
  }

  const bookingColumns = [
    { key: "id", header: "Booking ID", render: (r) => <span className="font-mono text-xs text-text-primary">{r.booking.id}</span> },
    { key: "customer", header: "Customer", render: (r) => r.booking.customer?.name ?? "—" },
    { key: "movie", header: "Movie", render: (r) => r.movie?.title ?? "—" },
    { key: "cinema", header: "Cinema", render: (r) => r.cinema?.name ?? "—" },
    { key: "showtime", header: "Showtime", render: (r) => `${formatDate(r.booking.date, { month: "short", day: "numeric" })}, ${r.booking.startTime}` },
    { key: "seats", header: "Seats", render: (r) => r.booking.seats.join(", ") },
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.booking.amount) },
    { key: "payment", header: "Payment", render: (r) => <StatusBadge status={r.booking.paymentStatus} /> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.booking.bookingStatus} /> },
  ];

  const showColumns = [
    { key: "movie", header: "Movie", render: (r) => r.movie?.title ?? "—" },
    { key: "cinema", header: "Cinema", render: (r) => r.cinema?.name ?? "—" },
    { key: "screen", header: "Screen", render: (r) => r.screen?.name ?? "—" },
    { key: "date", header: "Date", render: (r) => formatDate(r.showtime.date, { month: "short", day: "numeric" }) },
    { key: "time", header: "Time", render: (r) => r.showtime.startTime },
    { key: "available", header: "Available", render: (r) => r.showtime.totalSeats - r.showtime.bookedSeats },
    {
      key: "occupancy",
      header: "Occupancy",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(r.occupancy * 100)}%` }} />
          </div>
          <span className="text-xs text-text-muted">{Math.round(r.occupancy * 100)}%</span>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Welcome back, {admin.name.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-sm text-text-secondary">Here's what's happening across your cinemas today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(summary.totalRevenue)} icon={DollarSign} tone="accent" />
        <StatCard label="Total Bookings" value={summary.totalBookings.toLocaleString()} icon={Ticket} />
        <StatCard label="Total Customers" value={summary.totalCustomers.toLocaleString()} icon={Users} />
        <StatCard label="Active Movies" value={summary.activeMovies} icon={Film} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Revenue" value={formatCurrency(summary.todayRevenue)} icon={TrendingUp} />
        <StatCard label="Today's Bookings" value={summary.todayBookings} icon={Ticket} />
        <StatCard label="Upcoming Shows" value={summary.upcomingShows} icon={CalendarClock} />
        <StatCard label="Occupancy Rate" value={`${Math.round(summary.occupancyRate * 100)}%`} icon={Gauge} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <RevenueChart dailySeries={revenueSeries} />
        <BookingStatusChart data={statusDistribution} />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-text-primary">Popular Movies</h3>
          <Link to="/admin/movies" className="text-sm font-semibold text-accent-text hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {topMovies.map(({ movie, ticketsSold, revenue, occupancy }) => (
            <Link
              key={movie.id}
              to={`/admin/movies/${movie.id}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-border transition-colors hover:border-border-strong"
            >
              <div className="aspect-2/3 overflow-hidden bg-surface-hover">
                <img src={movie.poster} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="flex flex-col gap-1 p-3">
                <p className="line-clamp-1 text-sm font-semibold text-text-primary">{movie.title}</p>
                <p className="text-xs text-text-muted">{movie.genres.join(" • ")}</p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{ticketsSold} sold</span>
                  <span className="font-semibold text-accent-text">{formatCurrency(revenue)}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(occupancy * 100)}%` }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-text-primary">Recent Bookings</h3>
          <Link to="/admin/bookings" className="text-sm font-semibold text-accent-text hover:underline">
            View all
          </Link>
        </div>
        <DataTable columns={bookingColumns} rows={recentBookings} keyField={(r) => r.booking?.id} />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-text-primary">Upcoming Shows</h3>
          <Link to="/admin/showtimes" className="text-sm font-semibold text-accent-text hover:underline">
            View all
          </Link>
        </div>
        <DataTable columns={showColumns} rows={upcomingShows} keyField={(r) => r.showtime?.id} />
      </div>
    </div>
  );
}
