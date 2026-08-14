import MovieCard from "../movies/MovieCard";

export default function MovieRow({ movies }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4 xl:grid-cols-5">
      {movies.map((movie) => (
        <div key={movie.id} className="w-40 shrink-0 snap-start sm:w-auto">
          <MovieCard movie={movie} />
        </div>
      ))}
    </div>
  );
}
