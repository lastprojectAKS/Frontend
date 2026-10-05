import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Lock, AlertCircle, Loader2, Star, Tag } from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import BookingSummary from "../components/booking/BookingSummary";
import { useBooking } from "../context/BookingContext";
import { useAuth } from "../context/AuthContext";
import { getMovie } from "../services/movieService";
import { getCinema } from "../services/cinemaService";
import { createPaymentIntent, confirmBookingAfterPayment } from "../services/paymentService";
import { stripePromise } from "../lib/stripeClient";
import { formatCurrency } from "../lib/format";
import { readPendingPromo, clearPendingPromo } from "../lib/pendingPromo";
import { holdSeats, releaseSeatHolds } from "../services/seatService";

export default function Checkout() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { selection, pricing } = useBooking();
  const { movieId, cinemaId, date, time, showtimeId, seats } = selection;

  const [movie, setMovie] = useState(null);
  const [cinema, setCinema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState(null);
  const [quote, setQuote] = useState(null);
  const [intentError, setIntentError] = useState("");
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [promoInput, setPromoInput] = useState(() => readPendingPromo());
  const [appliedCode, setAppliedCode] = useState("");
  const [promoError, setPromoError] = useState("");

  useEffect(() => {
    clearPendingPromo();
  }, []);

  useEffect(() => {
    return () => {
      if (showtimeId) releaseSeatHolds(showtimeId).catch(() => {});
    };
  }, [showtimeId]);

  const hasSelection = Boolean(movieId && cinemaId && date && time && showtimeId && seats.length > 0);

  useEffect(() => {
    if (!hasSelection) return;
    const refresh = setInterval(() => holdSeats(showtimeId, seats).catch(() => {}), 2 * 60 * 1000);
    return () => clearInterval(refresh);
  }, [hasSelection, showtimeId, seats]);

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

  useEffect(() => {
    if (!hasSelection || !stripePromise) return;
    let cancelled = false;
    setClientSecret(null);
    setQuote(null);
    holdSeats(showtimeId, seats)
      .then(() => createPaymentIntent(showtimeId, seats, redeemPoints, appliedCode || null))
      .then(({ clientSecret: secret, quote: q }) => {
        if (!cancelled) {
          setClientSecret(secret);
          setQuote(q);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (appliedCode) {
          setPromoError(err.message || "That promo code could not be applied.");
          setAppliedCode("");
        } else {
          setIntentError(err.message || "Could not start payment. Please try again.");
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSelection, showtimeId, seats, redeemPoints, appliedCode]);

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoError("");
    setAppliedCode(code);
  }

  function removePromo() {
    setPromoInput("");
    setPromoError("");
    setAppliedCode("");
  }

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

  if (!stripePromise) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Payments aren't configured yet — set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in <code>.env</code> (see the
            README's "Payments" section).
          </p>
        </div>
      </div>
    );
  }

  if (intentError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p>{intentError}</p>
            <button
              type="button"
              onClick={() => navigate("/booking/seats")}
              className="mt-1 font-semibold underline underline-offset-2"
            >
              Choose different seats
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
      </div>
    );
  }

  return (
    // clientSecret as the key forces a full remount of the Elements subtree
    // (and the PaymentElement inside it) whenever the redeem-points toggle
    // produces a different PaymentIntent — Stripe doesn't support swapping
    // an already-mounted Elements tree to a different intent in place.
    <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm
        movie={movie}
        cinema={cinema}
        date={date}
        time={time}
        seats={seats}
        pricing={pricing}
        quote={quote}
        redeemPoints={redeemPoints}
        onToggleRedeemPoints={() => setRedeemPoints((v) => !v)}
        promoInput={promoInput}
        onPromoInputChange={setPromoInput}
        promoError={promoError}
        onApplyPromo={applyPromo}
        onRemovePromo={removePromo}
      />
    </Elements>
  );
}

function CheckoutForm({
  movie,
  cinema,
  date,
  time,
  seats,
  pricing,
  quote,
  redeemPoints,
  onToggleRedeemPoints,
  promoInput,
  onPromoInputChange,
  promoError,
  onApplyPromo,
  onRemovePromo,
}) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { confirmBooking } = useBooking();
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError("");

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed. Please check your card details and try again.");
      setSubmitting(false);
      return;
    }
    if (paymentIntent.status !== "succeeded") {
      setError("Payment was not completed. Please try again.");
      setSubmitting(false);
      return;
    }

    try {
      const booking = await confirmBookingAfterPayment(paymentIntent.id);
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
      // The payment succeeded but the booking itself failed (most likely the
      // seat-race case — someone else booked one of these seats while the
      // card was being charged). confirm-booking refunds the charge before
      // returning this error, so the customer isn't out of pocket for it.
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
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-text-primary">
              <Tag className="h-4 w-4 text-accent-text" aria-hidden="true" />
              Promo Code
            </h2>
            {quote.offerCode ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm">
                <p className="text-text-primary">
                  <span className="font-semibold">{quote.offerCode}</span> applied — you save{" "}
                  {formatCurrency(quote.offerDiscount)}
                </p>
                <button
                  type="button"
                  onClick={onRemovePromo}
                  className="shrink-0 font-semibold text-text-secondary underline underline-offset-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <label htmlFor="promo-code" className="sr-only">
                    Promo code
                  </label>
                  <input
                    id="promo-code"
                    value={promoInput}
                    onChange={(e) => onPromoInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onApplyPromo();
                      }
                    }}
                    placeholder="Enter a code"
                    autoComplete="off"
                    aria-describedby={promoError ? "promo-code-error" : undefined}
                    className="h-11 w-full min-w-0 rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-sm uppercase text-text-primary placeholder:normal-case placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={onApplyPromo}
                    disabled={!promoInput.trim()}
                    className="h-11 shrink-0 rounded-lg border border-border-strong px-4 text-sm font-semibold text-text-primary disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p id="promo-code-error" role="alert" className="mt-2 text-sm text-error">
                    {promoError}
                  </p>
                )}
              </div>
            )}
          </section>

          {quote.pointsAvailable > 0 && (
            <section className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="mb-4 text-lg font-bold text-text-primary">Loyalty Points</h2>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={redeemPoints}
                  onChange={onToggleRedeemPoints}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                />
                <span className="flex items-center gap-1.5 text-text-primary">
                  <Star className="h-4 w-4 text-warning" aria-hidden="true" />
                  Apply my {quote.pointsAvailable} points ({formatCurrency(quote.pointsAvailable / 100)} available)
                </span>
              </label>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-lg font-bold text-text-primary">Payment Method</h2>

            <PaymentElement />

            <p className="mt-4 flex items-center gap-1.5 text-xs text-text-muted">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Test mode — use Stripe's test card 4242 4242 4242 4242, any future expiry, any CVC. No real charge occurs.
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
              pricing={{
                byCategory: pricing.byCategory,
                fee: quote.fee,
                total: quote.total,
                discount: quote.discount,
                offerCode: quote.offerCode,
                offerDiscount: quote.offerDiscount,
              }}
              ctaLabel={submitting ? "Processing..." : "Complete Booking"}
              ctaDisabled={submitting || !stripe || !elements}
              ctaType="submit"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
