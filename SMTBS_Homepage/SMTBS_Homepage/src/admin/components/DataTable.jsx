import { Loader2, Inbox } from "lucide-react";

export default function DataTable({
  columns,
  rows,
  keyField = "id",
  loading = false,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Try adjusting your filters.",
  onRowClick,
}) {
  const getKey = typeof keyField === "function" ? keyField : (row) => row[keyField];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface py-20">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-strong bg-surface py-16 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-hover text-text-muted">
          <Inbox className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="font-semibold text-text-primary">{emptyTitle}</p>
        <p className="max-w-xs text-sm text-text-secondary">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-hover/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-border last:border-b-0 ${
                  onRowClick ? "cursor-pointer transition-colors hover:bg-surface-hover" : ""
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`whitespace-nowrap px-4 py-3.5 text-text-secondary ${col.className || ""}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
