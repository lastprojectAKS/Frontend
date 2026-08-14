import Button from "../ui/Button";
import { formatCurrency, formatDate } from "../../lib/format";

export default function BookingSummary({
  movie,
  cinema,
  date,
  time,
  seats,
  pricing,
  ctaLabel,
  ctaTo,
  onCta,
  ctaDisabled,
  ctaType = "button",
}) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5">
      <div className="flex gap-3">
        <img src={movie.poster} alt={`${movie.title} poster`} className="h-20 w-14 shrink-0 rounded-lg object-cover" />
        <div>
          <p className="font-semibold text-text-primary">{movie.title}</p>
          <p className="mt-1 text-xs text-text-muted">{cinema?.name}</p>
        </div>
      </div>

      <dl className="flex flex-col gap-2.5 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-text-muted">Date</dt>
          <dd className="font-medium text-text-primary">{date ? formatDate(date, { weekday: "short", month: "short", day: "numeric" }) : "—"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-muted">Time</dt>
          <dd className="font-medium text-text-primary">{time || "—"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-muted">Seats</dt>
          <dd className="text-right font-medium text-text-primary">
            {seats.length > 0 ? seats.slice().sort().join(", ") : "—"}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-muted">Quantity</dt>
          <dd className="font-medium text-text-primary">{seats.length}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
        {pricing.standardCount > 0 && (
          <div className="flex justify-between text-text-secondary">
            <span>Standard × {pricing.standardCount}</span>
            <span>{formatCurrency(pricing.standardSubtotal)}</span>
          </div>
        )}
        {pricing.vipCount > 0 && (
          <div className="flex justify-between text-text-secondary">
            <span>VIP × {pricing.vipCount}</span>
            <span>{formatCurrency(pricing.vipSubtotal)}</span>
          </div>
        )}
        <div className="flex justify-between text-text-secondary">
          <span>Booking fee</span>
          <span>{formatCurrency(pricing.fee)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2.5 text-base font-bold text-text-primary">
          <span>Total</span>
          <span>{formatCurrency(pricing.total)}</span>
        </div>
      </div>

      <Button to={ctaTo} onClick={onCta} disabled={ctaDisabled} type={ctaType} size="lg" className="w-full">
        {ctaLabel}
      </Button>
    </div>
  );
}
