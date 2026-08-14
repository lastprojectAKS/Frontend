export const cinemas = [
  {
    id: "downtown",
    name: "SMTBS Downtown",
    location: "142 Market Street, City Centre",
    distance: "1.8 km",
    amenities: ["IMAX", "Dolby Atmos", "Recliner", "Parking"],
    movieIds: [
      "dune-part-two",
      "oppenheimer",
      "inception",
      "the-batman",
      "ashes-of-meridian",
      "midnight-foundry",
    ],
  },
  {
    id: "riverside",
    name: "SMTBS Riverside",
    location: "8 Riverside Boulevard, Harbour District",
    distance: "3.2 km",
    amenities: ["Dolby Atmos", "Recliner", "Wheelchair Accessible"],
    movieIds: ["dune-part-two", "oppenheimer", "the-batman", "the-last-bloom", "echoes-of-verity"],
  },
  {
    id: "grand-mall",
    name: "SMTBS Grand Mall",
    location: "500 Grand Mall Avenue, Level 3",
    distance: "4.6 km",
    amenities: ["IMAX", "Parking", "Wheelchair Accessible"],
    movieIds: ["dune-part-two", "inception", "the-batman", "midnight-foundry", "ashes-of-meridian"],
  },
  {
    id: "uptown-plaza",
    name: "SMTBS Uptown Plaza",
    location: "27 Uptown Plaza, North End",
    distance: "6.1 km",
    amenities: ["Recliner", "Parking", "Wheelchair Accessible"],
    movieIds: ["oppenheimer", "inception", "the-last-bloom", "echoes-of-verity"],
  },
];

export const getCinemaById = (id) => cinemas.find((cinema) => cinema.id === id);

export const getCinemasForMovie = (movieId) =>
  cinemas.filter((cinema) => cinema.movieIds.includes(movieId));
