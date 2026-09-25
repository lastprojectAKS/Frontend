import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CreditCard, Apple, Wallet, Lock, AlertCircle, Loader2 } from "lucide-react";
import BookingSummary from "../components/booking/BookingSummary";
import { useBooking } from "../context/BookingContext";
import { useAuth } from "../context/AuthContext";
import { getMovie } from "../services/movieService";
import { getCinema } from "../services/cinemaService";
import { bookSeats } from "../services/bookingService";

const PAYMENT_METHODS = [
  { id: "card", label: "Card", icon: CreditCard },
  { id: "apple-pay", label: "Apple Pay", icon: Apple },
  { id: "google-pay", label: "Google Pay", icon: Wallet },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { isLoggedIn, refreshUser } = useAuth();
  const { selection, pricing, confirmBooking } = useBooking();
  const { movieId, cinemaId, date, time, showtimeId, seats } = selection;

  const [movie, setMovie] = useState(null);
  const [cinema, setCinema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const hasSelection = Boolean(movieId && cinemaId && date && time && showtimeId && seats.length > 0);

  useEffect(() => {
    if (!hasSelection) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([getMovie(movieId), getCinema(cinemaId)]).then(([movieData, cinemaData]) => {
      if (!cancelled) {
        setMovie(movieData);
        setCinema(cinemaData);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSelection, movieId, cinemaId]);

  if (!isLoggedIn || !hasSelection) {
    return <Navigate to="/booking" replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
      </div>
    );
  }

  if (!movie || !cinema) return <Navigate to="/booking" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const booking = await bookSeats(showtimeId, seats);
      confirmBooking({
        bookingCode: booking.booking_code,
        movieId: movie.id,
        cinemaId: cinema.id,
        date,
        time,
        seats,
        total: booking.amount,
      });
      await refreshUser();
      navigate("/booking/success");
    } catch (err) {
      // The most likely real failure here: someone else booked one of these
      // seats between selection and now (no seat hold exists). Send them
      // back to pick different seats rather than retrying blindly.
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent-text">Step 3 of 3</p>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => navigate("/booking/seats")}
                  className="mt-1 font-semibold underline underline-offset-2"
                >
                  Choose different seats
                </button>
              </div>
            </div>
          )}

          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-lg font-bold text-text-primary">Contact Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-text-secondary">Full Name</span>
                <input
                  required
                  type="text"
                  placeholder="class project"
                  className="h-11 rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-text-secondary">Email</span>
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  className="h-11 rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                <span className="font-medium text-text-secondary">Phone Number</span>
                <input
                  required
                  type="tel"
                  placeholder="(555) 123-4567"
                  className="h-11 rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-lg font-bold text-text-primary">Payment Method</h2>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id)}
                  aria-pressed={paymentMethod === id}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-colors ${
                    paymentMethod === id
                      ? "border-accent bg-accent/10 text-accent-text"
                      : "border-border-strong bg-bg-secondary text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            {paymentMethod === "card" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                  <span className="font-medium text-text-secondary">Card Number</span>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    className="h-11 rounded-lg border border-border-strong bg-bg-secondary px-3.5 font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-text-secondary">Expiry</span>
                  <input
                    required
                    type="text"
                    placeholder="MM/YY"
                    className="h-11 rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-text-secondary">CVC</span>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    placeholder="123"
                    className="h-11 rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border-strong bg-bg-secondary p-6 text-center text-sm text-text-secondary">
                You'll be prompted to confirm payment with {paymentMethod === "apple-pay" ? "Apple Pay" : "Google Pay"} in a real integration.
              </div>
            )}

            <p className="mt-4 flex items-center gap-1.5 text-xs text-text-muted">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              This is a demo checkout — payment isn't real, but the booking and seats are.
            </p>
          </section>
        </div>

        <div>
          <div className="sticky top-24">
            <BookingSummary
              movie={movie}
              cinema={cinema}
              date={date}
              time={time}
              seats={seats}
              pricing={pricing}
              ctaLabel={submitting ? "Processing..." : "Complete Booking"}
              ctaDisabled={submitting}
              ctaType="submit"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
