import CinemaCard from "../components/cinemas/CinemaCard";
import { cinemas } from "../data/cinemas";

export default function Cinemas() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent-text">Locations</p>
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">Cinemas</h1>
        <p className="mt-2 text-text-secondary">Browse every screen in your area and what's playing there.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cinemas.map((cinema) => (
          <CinemaCard key={cinema.id} cinema={cinema} />
        ))}
      </div>
    </div>
  );
}
