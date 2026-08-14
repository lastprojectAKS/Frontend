import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { CheckCircle2, Download, Ticket, Home, QrCode } from "lucide-react";
import Button from "../components/ui/Button";
import { useBooking } from "../context/BookingContext";
import { getMovieById } from "../data/movies";
import { getCinemaById } from "../data/cinemas";
import { formatCurrency, formatDate } from "../lib/format";

export default function BookingSuccess() {
  const { confirmedBooking, clearSelection } = useBooking();

  // Safe to clear here: Checkout has already unmounted, so its
  // selection-based redirect guard can no longer fire mid-navigation.
  useEffect(() => {
    clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!confirmedBooking) return <Navigate to="/" replace />;

  const movie = getMovieById(confirmedBooking.movieId);
  const cinema = getCinemaById(confirmedBooking.cinemaId);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
      </div>

      <h1 className="mt-5 text-2xl font-bold text-text-primary sm:text-3xl">Booking Confirmed!</h1>
      <p className="mt-2 text-text-secondary">Your tickets are ready. See you at the movies.</p>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 text-left">
        <div className="flex items-center gap-4">
          <img src={movie.poster} alt={`${movie.title} poster`} className="h-24 w-16 shrink-0 rounded-lg object-cover" />
          <div>
            <p className="font-bold text-text-primary">{movie.title}</p>
            <p className="text-sm text-text-muted">{cinema.name}</p>
          </div>
        </div>

        <dl className="mt-5 flex flex-col gap-2.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">Date</dt>
            <dd className="font-medium text-text-primary">{formatDate(confirmedBooking.date)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Time</dt>
            <dd className="font-medium text-text-primary">{confirmedBooking.time}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Seats</dt>
            <dd className="font-medium text-text-primary">{confirmedBooking.seats.slice().sort().join(", ")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Total Paid</dt>
            <dd className="font-medium text-text-primary">{formatCurrency(confirmedBooking.total)}</dd>
          </div>
        </dl>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
          <span className="font-mono text-sm font-semibold text-text-primary">{confirmedBooking.ref}</span>
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-bg-secondary text-text-muted">
            <QrCode className="h-7 w-7" aria-hidden="true" />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-text-muted">This is a frontend demo — no real ticket was purchased or charged.</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button variant="secondary" icon={Download}>
          Download Ticket
        </Button>
        <Button to="/profile" variant="secondary" icon={Ticket}>
          View Booking
        </Button>
        <Button to="/" icon={Home}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
