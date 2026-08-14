import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CreditCard, Apple, Wallet, Lock } from "lucide-react";
import BookingSummary from "../components/booking/BookingSummary";
import { useBooking } from "../context/BookingContext";
import { getMovieById } from "../data/movies";
import { getCinemaById } from "../data/cinemas";

const PAYMENT_METHODS = [
  { id: "card", label: "Card", icon: CreditCard },
  { id: "apple-pay", label: "Apple Pay", icon: Apple },
  { id: "google-pay", label: "Google Pay", icon: Wallet },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { selection, pricing, confirmBooking } = useBooking();
  const { movieId, cinemaId, date, time, seats } = selection;

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);

  const movie = movieId ? getMovieById(movieId) : null;
  const cinema = cinemaId ? getCinemaById(cinemaId) : null;

  if (!movie || !cinema || !date || !time || seats.length === 0) {
    return <Navigate to="/booking" replace />;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    // Simulated processing delay — no real payment is made.
    setTimeout(() => {
      confirmBooking({
        movieId: movie.id,
        cinemaId: cinema.id,
        date,
        time,
        seats,
        total: pricing.total,
      });
      navigate("/booking/success");
    }, 700);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent-text">Step 3 of 3</p>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-lg font-bold text-text-primary">Contact Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-text-secondary">Full Name</span>
                <input
                  required
                  type="text"
                  placeholder="Jordan Avery"
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
              This is a demo checkout. No real payment is processed or stored.
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
