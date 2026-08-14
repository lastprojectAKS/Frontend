import SectionHeader from "../ui/SectionHeader";
import ComingSoonCard from "../movies/ComingSoonCard";
import { comingSoonMovies } from "../../data/movies";

export default function ComingSoon() {
  return (
    <section className="border-t border-border bg-bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Mark Your Calendar"
          title="Coming Soon"
          description="Get notified the moment tickets go on sale."
          actionLabel="View All"
          actionTo="/movies?status=coming-soon"
        />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {comingSoonMovies.map((movie) => (
            <ComingSoonCard key={movie.id} movie={movie} />
          ))}
        </div>
      </div>
    </section>
  );
}
