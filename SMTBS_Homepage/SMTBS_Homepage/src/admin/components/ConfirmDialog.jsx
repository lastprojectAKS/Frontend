import { AlertTriangle, Loader2 } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
  blocked = false,
  blockedReason,
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <span
          className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full ${
            blocked ? "bg-warning/15 text-warning" : destructive ? "bg-error/15 text-error" : "bg-accent/15 text-accent-text"
          }`}
        >
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-bold text-text-primary">{title}</h2>
        {(blocked ? blockedReason : description) && (
          <p className="mt-2 text-sm text-text-secondary">{blocked ? blockedReason : description}</p>
        )}

        <div className="mt-6 flex w-full gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {blocked ? "Close" : "Cancel"}
          </Button>
          {!blocked && (
            <Button
              className={`flex-1 ${destructive ? "!bg-error hover:!bg-error/85" : ""}`}
              disabled={loading}
              onClick={onConfirm}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
