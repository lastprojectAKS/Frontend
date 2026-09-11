import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import CinemaCard from "../components/cinemas/CinemaCard";
import { listCinemas } from "../services/cinemaService";

export default function Cinemas() {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listCinemas().then((data) => {
      if (!cancelled) {
        setCinemas(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent-text">Locations</p>
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">Cinemas</h1>
        <p className="mt-2 text-text-secondary">Browse every screen in your area and what's playing there.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cinemas.map((cinema) => (
            <CinemaCard key={cinema.id} cinema={cinema} />
          ))}
        </div>
      )}
    </div>
  );
}
