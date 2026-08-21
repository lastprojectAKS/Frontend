import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pageCount, totalItems, pageSize, onChange }) {
  if (pageCount <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm sm:flex-row">
      <p className="text-text-muted">
        Showing <span className="font-medium text-text-secondary">{start}–{end}</span> of{" "}
        <span className="font-medium text-text-secondary">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-strong text-text-secondary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="px-2 text-text-secondary">
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === pageCount}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-strong text-text-secondary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
