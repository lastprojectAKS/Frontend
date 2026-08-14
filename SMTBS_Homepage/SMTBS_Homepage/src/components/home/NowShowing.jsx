import SectionHeader from "../ui/SectionHeader";
import MovieRow from "./MovieRow";
import { nowShowingMovies } from "../../data/movies";

export default function NowShowing() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="In Theatres"
        title="Now Showing"
        description="Catch these movies on the big screen today."
        actionLabel="View All"
        actionTo="/movies?status=now-showing"
      />
      <div className="mt-8">
        <MovieRow movies={nowShowingMovies} />
      </div>
    </section>
  );
}
