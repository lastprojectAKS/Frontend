export const SCREEN_TYPES = ["Standard", "Premium", "IMAX"];

// Seat categories always sum to a screen's capacity — capacity is derived
// from them rather than stored separately, so the two can never drift.
function seatCategories(standard, premium, vip) {
  return [
    { name: "Standard", count: standard, priceMultiplier: 1 },
    { name: "Premium", count: premium, priceMultiplier: 1.4 },
    { name: "VIP", count: vip, priceMultiplier: 1.9 },
  ].filter((c) => c.count > 0);
}

export const screens = [
  {
    id: "downtown-1",
    cinemaId: "downtown",
    name: "Screen 1",
    type: "IMAX",
    status: "Active",
    seatCategories: seatCategories(120, 40, 20),
  },
  {
    id: "downtown-2",
    cinemaId: "downtown",
    name: "Screen 2",
    type: "Standard",
    status: "Active",
    seatCategories: seatCategories(100, 20, 0),
  },
  {
    id: "downtown-3",
    cinemaId: "downtown",
    name: "Screen 3",
    type: "Premium",
    status: "Active",
    seatCategories: seatCategories(50, 30, 10),
  },
  {
    id: "riverside-1",
    cinemaId: "riverside",
    name: "Screen 1",
    type: "Standard",
    status: "Active",
    seatCategories: seatCategories(90, 20, 0),
  },
  {
    id: "riverside-2",
    cinemaId: "riverside",
    name: "Screen 2",
    type: "Premium",
    status: "Active",
    seatCategories: seatCategories(55, 20, 10),
  },
  {
    id: "grand-mall-1",
    cinemaId: "grand-mall",
    name: "Screen 1",
    type: "IMAX",
    status: "Active",
    seatCategories: seatCategories(140, 40, 20),
  },
  {
    id: "grand-mall-2",
    cinemaId: "grand-mall",
    name: "Screen 2",
    type: "Standard",
    status: "Active",
    seatCategories: seatCategories(110, 20, 0),
  },
  {
    id: "uptown-plaza-1",
    cinemaId: "uptown-plaza",
    name: "Screen 1",
    type: "Standard",
    status: "Inactive",
    seatCategories: seatCategories(75, 20, 0),
  },
  {
    id: "uptown-plaza-2",
    cinemaId: "uptown-plaza",
    name: "Screen 2",
    type: "Premium",
    status: "Inactive",
    seatCategories: seatCategories(45, 20, 5),
  },
];

export const getScreenCapacity = (screen) =>
  screen.seatCategories.reduce((sum, c) => sum + c.count, 0);

export const getScreenById = (id) => screens.find((s) => s.id === id);

export const getScreensForCinema = (cinemaId) => screens.filter((s) => s.cinemaId === cinemaId);
