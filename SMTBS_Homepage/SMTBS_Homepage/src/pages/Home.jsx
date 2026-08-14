import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Hero from "../components/home/Hero";
import NowShowing from "../components/home/NowShowing";
import ComingSoon from "../components/home/ComingSoon";
import CinemasPreview from "../components/home/CinemasPreview";
import OffersPreview from "../components/home/OffersPreview";
import WhyChooseUs from "../components/home/WhyChooseUs";
import SearchBar from "../components/movies/SearchBar";
import FilterBar from "../components/movies/FilterBar";
import { nowShowingMovies, allGenres } from "../data/movies";

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

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status !== "all") params.set("status", status);
    if (genre !== "all") params.set("genre", genre);
    navigate(`/movies?${params.toString()}`);
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

      <NowShowing />
      <ComingSoon />
      <CinemasPreview />
      <OffersPreview />
      <WhyChooseUs />
    </>
  );
}
