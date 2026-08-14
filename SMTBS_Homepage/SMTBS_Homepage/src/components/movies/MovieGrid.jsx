import { SearchX } from "lucide-react";
import MovieCard from "./MovieCard";
import EmptyState from "../ui/EmptyState";

export default function MovieGrid({ movies, emptyMessage = "Try a different search term or filter." }) {
  if (movies.length === 0) {
    return <EmptyState icon={SearchX} title="No movies found" description={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
