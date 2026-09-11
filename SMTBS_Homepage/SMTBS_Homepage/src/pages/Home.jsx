import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Hero from "../components/home/Hero";
import NowShowing from "../components/home/NowShowing";
import ComingSoon from "../components/home/ComingSoon";
import CinemasPreview from "../components/home/CinemasPreview";
import OffersPreview from "../components/home/OffersPreview";
import WhyChooseUs from "../components/home/WhyChooseUs";
import SearchBar from "../components/movies/SearchBar";
import FilterBar from "../components/movies/FilterBar";
import { listMovies, isNowShowing, isComingSoon } from "../services/movieService";
import { listCinemas } from "../services/cinemaService";
import { listOffers } from "../services/offerService";

const QUICK_FILTERS = [
  { value: "all", label: "All" },
  { value: "now-showing", label: "Now Showing" },
  { value: "coming-soon", label: "Coming Soon" },
];

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [genre, setGenre] = useState("all");

  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listMovies(), listCinemas(), listOffers()]).then(([movieData, cinemaData, offerData]) => {
      if (cancelled) return;
      setMovies(movieData);
      setCinemas(cinemaData);
      setOffers(offerData);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const nowShowingMovies = useMemo(() => movies.filter(isNowShowing), [movies]);
  const comingSoonMovies = useMemo(() => movies.filter(isComingSoon), [movies]);
  const allGenres = useMemo(() => [...new Set(movies.flatMap((m) => m.genres))].sort(), [movies]);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status !== "all") params.set("status", status);
    if (genre !== "all") params.set("genre", genre);
    navigate(`/movies?${params.toString()}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
      </div>
    );
  }

  return (
    <>
      <Hero movie={nowShowingMovies[0]} />

      <section className="mx-auto -mt-10 max-w-4xl px-4 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSearch}
          className="relative z-10 rounded-2xl border border-border bg-surface p-4 shadow-elevated sm:p-5"
        >
          <SearchBar value={query} onChange={setQuery} size="lg" />
          <div className="mt-4">
            <FilterBar
              genres={allGenres}
              activeGenre={genre}
              onGenreChange={setGenre}
              statusOptions={QUICK_FILTERS}
              activeStatus={status}
              onStatusChange={setStatus}
            />
          </div>
        </form>
      </section>

      <NowShowing movies={nowShowingMovies} />
      <ComingSoon movies={comingSoonMovies} />
      <CinemasPreview cinemas={cinemas} />
      <OffersPreview offers={offers} />
      <WhyChooseUs />
    </>
  );
}
