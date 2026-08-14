import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SearchBar from "../components/movies/SearchBar";
import FilterBar from "../components/movies/FilterBar";
import MovieGrid from "../components/movies/MovieGrid";
import { movies, allGenres } from "../data/movies";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "now-showing", label: "Now Showing" },
  { value: "coming-soon", label: "Coming Soon" },
];

export default function Movies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const status = searchParams.get("status") || "all";
  const genre = searchParams.get("genre") || "all";

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value === "all" || !value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  }

  const filteredMovies = useMemo(() => {
    const q = query.trim().toLowerCase();
    return movies.filter((movie) => {
      const matchesQuery =
        q === "" ||
        movie.title.toLowerCase().includes(q) ||
        movie.genres.some((g) => g.toLowerCase().includes(q));
      const matchesStatus = status === "all" || movie.status === status;
      const matchesGenre = genre === "all" || movie.genres.includes(genre);
      return matchesQuery && matchesStatus && matchesGenre;
    });
  }, [query, status, genre]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent-text">Browse</p>
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">Movies</h1>
        <p className="mt-2 text-text-secondary">Search and filter every movie playing or coming soon.</p>
      </div>

      <div className="flex flex-col gap-4">
        <SearchBar value={query} onChange={setQuery} />
        <FilterBar
          genres={allGenres}
          activeGenre={genre}
          onGenreChange={(g) => updateParam("genre", g)}
          statusOptions={STATUS_OPTIONS}
          activeStatus={status}
          onStatusChange={(s) => updateParam("status", s)}
        />
      </div>

      <p className="mt-6 text-sm text-text-muted">
        {filteredMovies.length} movie{filteredMovies.length === 1 ? "" : "s"} found
      </p>

      <div className="mt-4">
        <MovieGrid movies={filteredMovies} />
      </div>
    </div>
  );
}
