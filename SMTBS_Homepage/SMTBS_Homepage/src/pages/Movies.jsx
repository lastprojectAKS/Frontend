import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import SearchBar from "../components/movies/SearchBar";
import FilterBar from "../components/movies/FilterBar";
import MovieGrid from "../components/movies/MovieGrid";
import { listMovies, isNowShowing, isComingSoon } from "../services/movieService";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "now-showing", label: "Now Showing" },
  { value: "coming-soon", label: "Coming Soon" },
];

// URL query values stay the same short, shareable strings as before;
// they just map to the real Supabase status values internally now.
const STATUS_PREDICATES = { "now-showing": isNowShowing, "coming-soon": isComingSoon };

export default function Movies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const status = searchParams.get("status") || "all";
  const genre = searchParams.get("genre") || "all";

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listMovies().then((data) => {
      if (!cancelled) {
        setMovies(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const allGenres = useMemo(() => [...new Set(movies.flatMap((m) => m.genres))].sort(), [movies]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value === "all" || !value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  }

  const filteredMovies = useMemo(() => {
    const q = query.trim().toLowerCase();
    const statusPredicate = STATUS_PREDICATES[status];
    return movies.filter((movie) => {
      const matchesQuery =
        q === "" ||
        movie.title.toLowerCase().includes(q) ||
        movie.genres.some((g) => g.toLowerCase().includes(q));
      const matchesStatus = !statusPredicate || statusPredicate(movie);
      const matchesGenre = genre === "all" || movie.genres.includes(genre);
      return matchesQuery && matchesStatus && matchesGenre;
    });
  }, [movies, query, status, genre]);

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

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-text-muted">
            {filteredMovies.length} movie{filteredMovies.length === 1 ? "" : "s"} found
          </p>
          <div className="mt-4">
            <MovieGrid movies={filteredMovies} />
          </div>
        </>
      )}
    </div>
  );
}
