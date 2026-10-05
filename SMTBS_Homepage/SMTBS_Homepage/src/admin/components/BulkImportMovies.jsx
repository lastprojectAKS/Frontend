import { useRef, useState } from "react";
import { Upload, Download, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import { parseCsvRecords } from "../lib/csv";
import { mapCsvRecordToMovie } from "../lib/movieImport";
import { createMovie } from "../services/movieService";

// Best-effort by design: one bad row (duplicate title, missing field, bad
// date) shouldn't block the other 49 valid ones in the same file. Every
// row is validated and imported independently and reported on, rather than
// the whole upload succeeding or failing as a unit.
export default function BulkImportMovies({ onImported }) {
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [fileError, setFileError] = useState("");

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file after fixing it
    if (!file) return;

    setFileError("");
    setResults(null);

    const text = await file.text();
    const records = parseCsvRecords(text);
    if (records.length === 0) {
      setFileError("No rows found in that file. Make sure it matches the template's column headers.");
      return;
    }

    setImporting(true);
    const imported = [];
    const skipped = [];

    // Sequential, not Promise.all — createMovie() hits the same unique-title
    // constraint check real-time, and importing a large file 10-at-once
    // would just race itself for no real speed benefit at this scale.
    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2; // +1 for the header row, +1 for 1-indexing
      const mapped = mapCsvRecordToMovie(records[i], rowNumber);
      if (!mapped.ok) {
        skipped.push({ row: mapped.row, title: mapped.title, reason: mapped.errors.join(", ") });
        continue;
      }
      try {
        await createMovie(mapped.data);
        imported.push(mapped.data.title);
      } catch (err) {
        skipped.push({ row: rowNumber, title: mapped.data.title, reason: err.message });
      }
    }

    setResults({ imported, skipped });
    setImporting(false);
    if (imported.length > 0) onImported();
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-secondary">
        Upload a CSV matching the template below — one row per movie. Genres and cast are{" "}
        <code className="rounded bg-bg-secondary px-1 py-0.5 text-xs">;</code>-separated lists. Rows with errors are
        skipped and reported; valid rows are still imported.
      </p>

      <a
        href="/templates/movies-import-template.csv"
        download
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download CSV template
      </a>

      <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
      <Button
        type="button"
        icon={Upload}
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="w-fit"
      >
        {importing ? "Importing..." : "Choose CSV file"}
      </Button>

      {fileError && (
        <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{fileError}</p>
        </div>
      )}

      {results && (
        <div className="flex flex-col gap-3">
          {results.imported.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                Imported {results.imported.length} movie{results.imported.length === 1 ? "" : "s"}:{" "}
                {results.imported.join(", ")}
              </p>
            </div>
          )}
          {results.skipped.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="font-semibold">
                  Skipped {results.skipped.length} row{results.skipped.length === 1 ? "" : "s"}:
                </p>
              </div>
              <ul className="ml-6 list-disc">
                {results.skipped.map((s) => (
                  <li key={s.row}>
                    Row {s.row} ({s.title}): {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
