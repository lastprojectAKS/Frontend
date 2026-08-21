import { delay } from "../lib/asyncDelay";
import { movies, getMovieById, MOVIE_STATUSES } from "../data/movies";
import { canDeleteMovie } from "../lib/businessRules";

export { MOVIE_STATUSES };

export async function listMovies() {
  await delay();
  return [...movies];
}

export async function getMovie(id) {
  await delay();
  const movie = getMovieById(id);
  if (!movie) throw new Error(`Movie "${id}" not found.`);
  return { ...movie };
}

export async function createMovie(data) {
  await delay();
  const id =
    data.id ||
    data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  if (movies.some((m) => m.id === id)) {
    throw new Error("A movie with this title already exists.");
  }

  const movie = { ...data, id };
  movies.push(movie);
  return movie;
}

export async function updateMovie(id, patch) {
  await delay();
  const index = movies.findIndex((m) => m.id === id);
  if (index === -1) throw new Error(`Movie "${id}" not found.`);
  movies[index] = { ...movies[index], ...patch };
  return movies[index];
}

export async function deleteMovie(id) {
  await delay();
  const { allowed, reason } = canDeleteMovie(id);
  if (!allowed) throw new Error(reason);

  const index = movies.findIndex((m) => m.id === id);
  if (index === -1) throw new Error(`Movie "${id}" not found.`);
  movies.splice(index, 1);
}

export async function setMovieStatus(id, status) {
  return updateMovie(id, { status });
}
