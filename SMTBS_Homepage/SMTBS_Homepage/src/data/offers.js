export const offers = [
  {
    id: "student-discount",
    title: "Student Discount",
    description: "Show a valid student ID at checkout and save on any weekday screening.",
    discount: "20% OFF",
    validity: "Mon–Thu, all cinemas",
    code: "STUDENT20",
  },
  {
    id: "weekend-family",
    title: "Weekend Family Deal",
    description: "Bring the whole family — bundle four tickets and snacks for one flat price.",
    discount: "Save $15",
    validity: "Sat–Sun, family screenings",
    code: "FAMILY15",
  },
  {
    id: "tuesday-deal",
    title: "Tuesday Movie Deal",
    description: "Every Tuesday, all standard tickets drop to a flat rate across every cinema.",
    discount: "$8 Tickets",
    validity: "Every Tuesday",
    code: "TUESDAY8",
  },
  {
    id: "couples-package",
    title: "Couples Package",
    description: "Two premium recliner seats plus a shared snack box, ready when you arrive.",
    discount: "15% OFF",
    validity: "Fri–Sun, recliner seats",
    code: "COUPLES15",
  },
];

export const getOfferById = (id) => offers.find((offer) => offer.id === id);
