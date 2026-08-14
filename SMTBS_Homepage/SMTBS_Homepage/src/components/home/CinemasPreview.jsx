import SectionHeader from "../ui/SectionHeader";
import CinemaCard from "../cinemas/CinemaCard";
import { cinemas } from "../../data/cinemas";

export default function CinemasPreview() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Find A Screen"
        title="Cinemas Near You"
        description="Premium screens with the amenities that matter."
        actionLabel="View All"
        actionTo="/cinemas"
      />
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cinemas.slice(0, 4).map((cinema) => (
          <CinemaCard key={cinema.id} cinema={cinema} />
        ))}
      </div>
    </section>
  );
}
