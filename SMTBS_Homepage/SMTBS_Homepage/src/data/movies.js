export const movies = [
  {
    id: "dune-part-two",
    title: "Dune: Part Two",
    poster: "/images/dune-part-two.jpeg",
    rating: 8.6,
    genres: ["Sci-Fi", "Adventure"],
    duration: 166,
    releaseDate: "2026-03-01",
    status: "now-showing",
    language: "English",
    ageRating: "PG-13",
    description:
      "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.",
    cast: [
      { name: "Timothée Chalamet", role: "Paul Atreides" },
      { name: "Zendaya", role: "Chani" },
      { name: "Rebecca Ferguson", role: "Lady Jessica" },
      { name: "Josh Brolin", role: "Gurney Halleck" },
      { name: "Austin Butler", role: "Feyd-Rautha" },
    ],
  },
  {
    id: "oppenheimer",
    title: "Oppenheimer",
    poster: "/images/oppenheimer.jpeg",
    rating: 8.9,
    genres: ["Drama", "History"],
    duration: 180,
    releaseDate: "2026-07-21",
    status: "now-showing",
    language: "English",
    ageRating: "R",
    description:
      "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II, and the moral weight of unleashing a power that could end the world.",
    cast: [
      { name: "Cillian Murphy", role: "J. Robert Oppenheimer" },
      { name: "Emily Blunt", role: "Kitty Oppenheimer" },
      { name: "Matt Damon", role: "Leslie Groves" },
      { name: "Robert Downey Jr.", role: "Lewis Strauss" },
      { name: "Florence Pugh", role: "Jean Tatlock" },
    ],
  },
  {
    id: "inception",
    title: "Inception",
    poster: "/images/inception.jpeg",
    rating: 8.8,
    genres: ["Sci-Fi", "Thriller"],
    duration: 148,
    releaseDate: "2010-07-16",
    status: "now-showing",
    language: "English",
    ageRating: "PG-13",
    description:
      "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO, in a job that spirals into layers of reality itself.",
    cast: [
      { name: "Leonardo DiCaprio", role: "Cobb" },
      { name: "Joseph Gordon-Levitt", role: "Arthur" },
      { name: "Elliot Page", role: "Ariadne" },
      { name: "Tom Hardy", role: "Eames" },
    ],
  },
  {
    id: "the-batman",
    title: "The Batman",
    poster: "/images/the-batman.jpg",
    rating: 7.8,
    genres: ["Action", "Crime"],
    duration: 176,
    releaseDate: "2022-03-04",
    status: "now-showing",
    language: "English",
    ageRating: "PG-13",
    description:
      "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
    cast: [
      { name: "Robert Pattinson", role: "Bruce Wayne / Batman" },
      { name: "Zoë Kravitz", role: "Selina Kyle" },
      { name: "Paul Dano", role: "The Riddler" },
      { name: "Jeffrey Wright", role: "James Gordon" },
    ],
  },
  {
    id: "poor-things",
    title: "Poor Things",
    poster: "/images/poor-things.jpg",
    rating: 8.1,
    genres: ["Fantasy", "Comedy"],
    duration: 141,
    releaseDate: "2026-09-12",
    status: "coming-soon",
    language: "English",
    ageRating: "R",
    description:
      "The incredible tale of Bella Baxter, a young woman brought back to life by a brilliant scientist. Hungry for the freedom this new life brings, Bella sets off on a whirlwind adventure across the world.",
    cast: [
      { name: "Emma Stone", role: "Bella Baxter" },
      { name: "Mark Ruffalo", role: "Duncan Wedderburn" },
      { name: "Willem Dafoe", role: "Dr. Godwin Baxter" },
    ],
  },
  {
    id: "past-lives",
    title: "Past Lives",
    poster: "/images/past-lives.jpg",
    rating: 8.0,
    genres: ["Drama", "Romance"],
    duration: 106,
    releaseDate: "2026-09-26",
    status: "coming-soon",
    language: "English",
    ageRating: "PG-13",
    description:
      "Nora and Hae Sung, two deeply connected childhood friends, are reunited in New York for one fateful week as they confront notions of destiny, love, and the choices that make a life.",
    cast: [
      { name: "Greta Lee", role: "Nora" },
      { name: "Teo Yoo", role: "Hae Sung" },
      { name: "John Magaro", role: "Arthur" },
    ],
  },
];

export const getMovieById = (id) => movies.find((movie) => movie.id === id);

export const nowShowingMovies = movies.filter((m) => m.status === "now-showing");
export const comingSoonMovies = movies.filter((m) => m.status === "coming-soon");

export const allGenres = [...new Set(movies.flatMap((m) => m.genres))].sort();
