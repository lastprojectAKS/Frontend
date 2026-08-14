import { Film } from "lucide-react";
import Modal from "../ui/Modal";

export default function TrailerModal({ movie, open, onClose }) {
  if (!movie) return null;

  return (
    <Modal open={open} onClose={onClose} title={`${movie.title} — Trailer`} size="lg">
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-bg-secondary text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-text-muted">
          <Film className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="max-w-xs text-sm text-text-secondary">
          Trailer playback isn't available in this frontend demo.
        </p>
      </div>
    </Modal>
  );
}
