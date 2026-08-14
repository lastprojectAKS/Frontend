import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Ticket, Play, Clock, Calendar, Globe, ShieldAlert } from "lucide-react";
import Rating from "../components/ui/Rating";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import TrailerModal from "../components/movies/TrailerModal";
import { getMovieById } from "../data/movies";
import { getCinemasForMovie } from "../data/cinemas";
import { formatDuration, formatDate } from "../lib/format";

export default function MovieDetails() {
  const { id } = useParams();
  const movie = getMovieById(id);
  const [trailerOpen, setTrailerOpen] = useState(false);

  if (!movie) return <Navigate to="/movies" replace />;

  const isComingSoon = movie.status === "coming-soon";
  const cinemas = getCinemasForMovie(movie.id);

  return (
    <div>
      <section className="theme-dark-scope relative overflow-hidden bg-bg-primary">
        <div className="absolute inset-0">
          <img src={movie.poster} alt="" aria-hidden="true" className="h-full w-full object-cover object-top opacity-30 blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/85 to-bg-primary/60" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-32 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 sm:flex-row">
            <img
              src={movie.poster}
              alt={`${movie.title} poster`}
              className="mx-auto aspect-2/3 w-48 shrink-0 rounded-xl object-cover shadow-elevated sm:mx-0"
            />

            <div className="flex flex-1 flex-col justify-end text-center sm:text-left">
              <Badge tone={isComingSoon ? "warning" : "success"} className="mx-auto sm:mx-0 w-fit">
                {isComingSoon ? "Coming Soon" : "Now Showing"}
              </Badge>

              <h1 className="mt-3 text-3xl font-extrabold text-text-primary sm:text-4xl">{movie.title}</h1>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm text-text-secondary sm:justify-start">
                <Rating value={movie.rating} />
                <span aria-hidden="true">·</span>
                <span>{movie.genres.join(", ")}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDuration(movie.duration)}</span>
                <span aria-hidden="true">·</span>
                <span>{movie.ageRating}</span>
              </div>

              <p className="mt-4 max-w-2xl text-text-secondary">{movie.description}</p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <Button
                  to={isComingSoon ? undefined : `/booking?movie=${movie.id}`}
                  disabled={isComingSoon}
                  size="lg"
                  icon={Ticket}
                >
                  {isComingSoon ? "Not Yet Available" : "Book Tickets"}
                </Button>
                <Button variant="secondary" size="lg" icon={Play} onClick={() => setTrailerOpen(true)}>
                  Watch Trailer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-text-primary">Cast</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {movie.cast.map((member) => (
                <div key={member.name} className="rounded-xl border border-border bg-surface p-4">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary text-sm font-bold text-text-secondary">
                    {member.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <p className="text-sm font-semibold text-text-primary">{member.name}</p>
                  <p className="text-xs text-text-muted">{member.role}</p>
                </div>
              ))}
            </div>

            <h2 className="mt-10 text-xl font-bold text-text-primary">Available Cinemas</h2>
            {isComingSoon ? (
              <p className="mt-4 text-sm text-text-secondary">
                Showtimes will be available once this movie is released.
              </p>
            ) : cinemas.length === 0 ? (
              <p className="mt-4 text-sm text-text-secondary">No cinemas are currently showing this movie.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {cinemas.map((cinema) => (
                  <div
                    key={cinema.id}
                    className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-text-primary">{cinema.name}</p>
                      <p className="text-sm text-text-muted">{cinema.location}</p>
                    </div>
                    <Button to={`/booking?movie=${movie.id}&cinema=${cinema.id}`} variant="secondary" size="sm">
                      Select Showtime
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-lg font-bold text-text-primary">Movie Information</h2>
            <dl className="mt-4 flex flex-col gap-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-text-muted">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  Release Date
                </dt>
                <dd className="font-medium text-text-primary">{formatDate(movie.releaseDate, { year: "numeric", month: "short", day: "numeric" })}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-text-muted">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Duration
                </dt>
                <dd className="font-medium text-text-primary">{formatDuration(movie.duration)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-text-muted">
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  Language
                </dt>
                <dd className="font-medium text-text-primary">{movie.language}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-text-muted">
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  Rating
                </dt>
                <dd className="font-medium text-text-primary">{movie.ageRating}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <TrailerModal movie={movie} open={trailerOpen} onClose={() => setTrailerOpen(false)} />
    </div>
  );
}
