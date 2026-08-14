import { useState } from "react";
import { Star, Ticket, Heart, Settings as SettingsIcon, Check } from "lucide-react";
import Tabs from "../components/ui/Tabs";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import MovieGrid from "../components/movies/MovieGrid";
import { mockBookings, mockFavourites, mockProfile } from "../data/bookings";
import { getMovieById } from "../data/movies";
import { getCinemaById } from "../data/cinemas";
import { formatCurrency, formatDate } from "../lib/format";

function BookingRow({ booking }) {
  const movie = getMovieById(booking.movieId);
  const cinema = getCinemaById(booking.cinemaId);
  if (!movie || !cinema) return null;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <img src={movie.poster} alt={`${movie.title} poster`} className="h-20 w-14 shrink-0 rounded-lg object-cover" />
        <div>
          <p className="font-semibold text-text-primary">{movie.title}</p>
          <p className="text-xs text-text-muted">{cinema.name}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {formatDate(booking.date, { month: "short", day: "numeric" })} · {booking.time} · Seats{" "}
            {booking.seats.join(", ")}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
        <Badge tone={booking.status === "upcoming" ? "success" : "neutral"}>
          {booking.status === "upcoming" ? "Upcoming" : "Past"}
        </Badge>
        <span className="text-sm font-semibold text-text-primary">{formatCurrency(booking.total)}</span>
      </div>
    </div>
  );
}

function SettingsForm() {
  const [saved, setSaved] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-text-secondary">Full Name</span>
        <input
          defaultValue={mockProfile.name}
          className="h-11 rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-text-secondary">Email</span>
        <input
          type="email"
          defaultValue={mockProfile.email}
          className="h-11 rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <label className="flex items-center justify-between gap-3 rounded-lg border border-border-strong bg-bg-secondary px-3.5 py-3 text-sm">
        <span className="font-medium text-text-secondary">Email me about new releases</span>
        <input type="checkbox" defaultChecked className="h-4 w-4 accent-accent" />
      </label>
      <Button type="submit" icon={saved ? Check : undefined} className="mt-2 w-fit">
        {saved ? "Saved" : "Save Changes"}
      </Button>
    </form>
  );
}

export default function Profile() {
  const upcoming = mockBookings.filter((b) => b.status === "upcoming");
  const past = mockBookings.filter((b) => b.status === "past");
  const favouriteMovies = mockFavourites.map((id) => getMovieById(id)).filter(Boolean);

  const tabs = [
    {
      value: "upcoming",
      label: "Upcoming",
      content:
        upcoming.length > 0 ? (
          <div className="flex flex-col gap-3">
            {upcoming.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Ticket} title="No upcoming bookings" description="Book a movie and it'll show up here." />
        ),
    },
    {
      value: "past",
      label: "Past",
      content:
        past.length > 0 ? (
          <div className="flex flex-col gap-3">
            {past.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Ticket} title="No past bookings" description="Your booking history will appear here." />
        ),
    },
    {
      value: "favourites",
      label: "Favourites",
      content: <MovieGrid movies={favouriteMovies} emptyMessage="Tap the heart on a movie to save it here." />,
    },
    {
      value: "settings",
      label: "Settings",
      content: <SettingsForm />,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 text-2xl font-bold text-accent">
          {mockProfile.name
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{mockProfile.name}</h1>
          <p className="text-text-secondary">{mockProfile.email}</p>
          <div className="mt-2 flex items-center justify-center gap-3 text-sm text-text-muted sm:justify-start">
            <span>Member since {mockProfile.memberSince}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-semibold text-warning">
              <Star className="h-3.5 w-3.5 fill-warning" aria-hidden="true" />
              {mockProfile.loyaltyPoints} points
            </span>
          </div>
        </div>
      </div>

      <Tabs
        tabs={tabs.map((tab) => ({
          ...tab,
          label: (
            <span className="inline-flex items-center gap-1.5">
              {tab.value === "favourites" && <Heart className="h-3.5 w-3.5" aria-hidden="true" />}
              {tab.value === "settings" && <SettingsIcon className="h-3.5 w-3.5" aria-hidden="true" />}
              {tab.label}
            </span>
          ),
        }))}
      />
    </div>
  );
}
