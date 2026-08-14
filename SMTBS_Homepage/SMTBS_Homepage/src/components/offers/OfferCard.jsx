import { Tag, Calendar } from "lucide-react";
import Button from "../ui/Button";

export default function OfferCard({ offer }) {
  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-text-primary">{offer.title}</h3>
          <p className="mt-1.5 text-sm text-text-secondary">{offer.description}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-accent/15 px-3 py-1.5 text-sm font-extrabold text-accent-text">
          {offer.discount}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
        {offer.validity}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border-strong px-3 py-1.5 text-xs font-mono font-semibold text-text-secondary">
          <Tag className="h-3.5 w-3.5" aria-hidden="true" />
          {offer.code}
        </span>
        <Button to="/movies" variant="secondary" size="sm">
          Use Offer
        </Button>
      </div>
    </div>
  );
}
