import { delay } from "../lib/asyncDelay";
import { cinemas, getCinemaById } from "../data/cinemas";
import { screens, getScreensForCinema, getScreenById, getScreenCapacity } from "../data/screens";
import { canReduceScreenCapacity, canDeactivateCinema } from "../lib/businessRules";

export { getScreenCapacity };

export async function listCinemas() {
  await delay();
  return cinemas.map((cinema) => ({ ...cinema, screenCount: getScreensForCinema(cinema.id).length }));
}

export async function getCinema(id) {
  await delay();
  const cinema = getCinemaById(id);
  if (!cinema) throw new Error(`Cinema "${id}" not found.`);
  return { ...cinema, screens: getScreensForCinema(id) };
}

export async function createCinema(data) {
  await delay();
  const id =
    data.id ||
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  if (cinemas.some((c) => c.id === id)) throw new Error("A cinema with this name already exists.");

  const cinema = { ...data, id, status: data.status || "Active" };
  cinemas.push(cinema);
  return cinema;
}

export async function updateCinema(id, patch) {
  await delay();

  if (patch.status === "Inactive") {
    const { warning } = canDeactivateCinema(id);
    if (warning) {
      // Surfaced to the caller as a non-blocking warning, not an error —
      // deactivation is still allowed, the UI just needs to show it.
      patch = { ...patch, __warning: warning };
    }
  }

  const index = cinemas.findIndex((c) => c.id === id);
  if (index === -1) throw new Error(`Cinema "${id}" not found.`);
  const { __warning, ...rest } = patch;
  cinemas[index] = { ...cinemas[index], ...rest };
  return { ...cinemas[index], __warning };
}

export async function listScreens(cinemaId) {
  await delay();
  return getScreensForCinema(cinemaId).map((s) => ({ ...s, capacity: getScreenCapacity(s) }));
}

export async function getScreen(id) {
  await delay();
  const screen = getScreenById(id);
  if (!screen) throw new Error(`Screen "${id}" not found.`);
  return { ...screen, capacity: getScreenCapacity(screen) };
}

export async function createScreen(data) {
  await delay();
  const id = data.id || `${data.cinemaId}-${screens.filter((s) => s.cinemaId === data.cinemaId).length + 1}`;
  const screen = { ...data, id, status: data.status || "Active" };
  screens.push(screen);
  return screen;
}

export async function updateScreen(id, patch) {
  await delay();

  if (patch.seatCategories) {
    const newCapacity = patch.seatCategories.reduce((sum, c) => sum + c.count, 0);
    const { allowed, reason } = canReduceScreenCapacity(id, newCapacity);
    if (!allowed) throw new Error(reason);
  }

  const index = screens.findIndex((s) => s.id === id);
  if (index === -1) throw new Error(`Screen "${id}" not found.`);
  screens[index] = { ...screens[index], ...patch };
  return { ...screens[index], capacity: getScreenCapacity(screens[index]) };
}
