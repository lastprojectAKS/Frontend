// Admin's own cinema records. Seeded from the same four cinemas the
// customer app shows, extended with the operational detail admin needs
// (address, contact, active/inactive) that the customer app has no use for.

export const cinemas = [
  {
    id: "downtown",
    name: "SMTBS Downtown",
    location: "City Centre",
    address: "142 Market Street, City Centre",
    phone: "+1 (212) 555-0142",
    email: "downtown@smtbs.example",
    status: "Active",
  },
  {
    id: "riverside",
    name: "SMTBS Riverside",
    location: "Harbour District",
    address: "8 Riverside Boulevard, Harbour District",
    phone: "+1 (212) 555-0108",
    email: "riverside@smtbs.example",
    status: "Active",
  },
  {
    id: "grand-mall",
    name: "SMTBS Grand Mall",
    location: "Grand Mall, Level 3",
    address: "500 Grand Mall Avenue, Level 3",
    phone: "+1 (212) 555-0500",
    email: "grandmall@smtbs.example",
    status: "Active",
  },
  {
    id: "uptown-plaza",
    name: "SMTBS Uptown Plaza",
    location: "North End",
    address: "27 Uptown Plaza, North End",
    phone: "+1 (212) 555-0027",
    email: "uptown@smtbs.example",
    status: "Inactive",
  },
];

export const getCinemaById = (id) => cinemas.find((c) => c.id === id);
