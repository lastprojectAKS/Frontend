import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import SeatMap from "../components/booking/SeatMap";
import BookingSummary from "../components/booking/BookingSummary";
import Button from "../components/ui/Button";
import { useBooking } from "../context/BookingContext";
import { getMovieById } from "../data/movies";
import { getCinemaById } from "../data/cinemas";
import { generateSeatMap } from "../data/seatmap";
import { formatCurrency } from "../lib/format";

export default function SeatSelection() {
  const navigate = useNavigate();
  const { selection, toggleSeat, pricing } = useBooking();
  const { movieId, cinemaId, date, time, seats } = selection;

  const movie = movieId ? getMovieById(movieId) : null;
  const cinema = cinemaId ? getCinemaById(cinemaId) : null;

  const rows = useMemo(() => {
    if (!movieId || !cinemaId || !date || !time) return [];
    return generateSeatMap(`${movieId}-${cinemaId}-${date}-${time}`);
  }, [movieId, cinemaId, date, time]);

  if (!movie || !cinema || !date || !time) {
    return <Navigate to="/booking" replace />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 pb-32 sm:px-6 lg:px-8 lg:pb-12">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent-text">Step 2 of 3</p>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Choose Your Seats</h1>
        <p className="mt-1 text-text-secondary">
          {movie.title} · {cinema.name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-8">
          <SeatMap rows={rows} selectedSeats={seats} onToggleSeat={toggleSeat} />
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24">
            <BookingSummary
              movie={movie}
              cinema={cinema}
              date={date}
              time={time}
              seats={seats}
              pricing={pricing}
              ctaLabel="Continue to Checkout"
              ctaDisabled={seats.length === 0}
              onCta={() => navigate("/checkout")}
            />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-secondary/95 p-4 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-xs text-text-muted">{seats.length} seat{seats.length === 1 ? "" : "s"} selected</p>
            <p className="text-lg font-bold text-text-primary">{formatCurrency(pricing.total)}</p>
          </div>
          <Button disabled={seats.length === 0} onClick={() => navigate("/checkout")}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
