export const mockBookings = [
  {
    id: "SMTBS-7F3KQ2",
    movieId: "dune-part-two",
    cinemaId: "downtown",
    date: "2026-08-20",
    time: "7:30 PM",
    seats: ["E5", "E6"],
    total: 26.5,
    status: "upcoming",
  },
  {
    id: "SMTBS-9XJ4R1",
    movieId: "the-batman",
    cinemaId: "grand-mall",
    date: "2026-06-02",
    time: "4:00 PM",
    seats: ["C3", "C4", "C5"],
    total: 38.5,
    status: "past",
  },
  {
    id: "SMTBS-2LP8VN",
    movieId: "inception",
    cinemaId: "uptown-plaza",
    date: "2026-04-14",
    time: "10:15 PM",
    seats: ["F8"],
    total: 14.5,
    status: "past",
  },
];

export const mockFavourites = ["dune-part-two", "inception", "oppenheimer"];

export const mockProfile = {
  name: "Jordan Avery",
  email: "jordan.avery@example.com",
  memberSince: "2024",
  loyaltyPoints: 240,
};
