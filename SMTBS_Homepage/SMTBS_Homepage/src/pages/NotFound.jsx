import { Compass } from "lucide-react";
import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-text-muted">
        <Compass className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary">Page not found</h1>
      <p className="text-text-secondary">The page you're looking for doesn't exist or has moved.</p>
      <Button to="/" className="mt-2">
        Back to Home
      </Button>
    </div>
  );
}
