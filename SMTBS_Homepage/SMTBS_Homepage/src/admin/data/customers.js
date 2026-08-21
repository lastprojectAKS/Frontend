// Booking totals/spend/last-booking are intentionally NOT stored here —
// they're derived from admin/data/bookings.js (see
// admin/lib/customerStats.js) so the two data sets can never drift apart.

export const customers = [
  { id: "cus-001", name: "Jordan Avery", email: "jordan.avery@example.com", phone: "+1 202-555-0101", status: "Active", joinedAt: "2025-01-14" },
  { id: "cus-002", name: "Priya Kapoor", email: "priya.kapoor@example.com", phone: "+1 202-555-0102", status: "Active", joinedAt: "2025-02-02" },
  { id: "cus-003", name: "Daniel Lee", email: "daniel.lee@example.com", phone: "+1 202-555-0103", status: "Active", joinedAt: "2025-02-19" },
  { id: "cus-004", name: "Maya Torres", email: "maya.torres@example.com", phone: "+1 202-555-0104", status: "Active", joinedAt: "2025-03-05" },
  { id: "cus-005", name: "Ethan Walsh", email: "ethan.walsh@example.com", phone: "+1 202-555-0105", status: "Active", joinedAt: "2025-03-21" },
  { id: "cus-006", name: "Aisha Rahman", email: "aisha.rahman@example.com", phone: "+1 202-555-0106", status: "Active", joinedAt: "2025-04-02" },
  { id: "cus-007", name: "Noah Bennett", email: "noah.bennett@example.com", phone: "+1 202-555-0107", status: "Inactive", joinedAt: "2025-04-18" },
  { id: "cus-008", name: "Sofia Marino", email: "sofia.marino@example.com", phone: "+1 202-555-0108", status: "Active", joinedAt: "2025-05-01" },
  { id: "cus-009", name: "Liam Chen", email: "liam.chen@example.com", phone: "+1 202-555-0109", status: "Active", joinedAt: "2025-05-16" },
  { id: "cus-010", name: "Grace Okafor", email: "grace.okafor@example.com", phone: "+1 202-555-0110", status: "Active", joinedAt: "2025-06-03" },
  { id: "cus-011", name: "Marcus Webb", email: "marcus.webb@example.com", phone: "+1 202-555-0111", status: "Active", joinedAt: "2025-06-20" },
  { id: "cus-012", name: "Elena Petrova", email: "elena.petrova@example.com", phone: "+1 202-555-0112", status: "Inactive", joinedAt: "2025-07-04" },
  { id: "cus-013", name: "Ryan Foster", email: "ryan.foster@example.com", phone: "+1 202-555-0113", status: "Active", joinedAt: "2025-07-22" },
  { id: "cus-014", name: "Hana Suzuki", email: "hana.suzuki@example.com", phone: "+1 202-555-0114", status: "Active", joinedAt: "2025-08-09" },
  { id: "cus-015", name: "Owen Mitchell", email: "owen.mitchell@example.com", phone: "+1 202-555-0115", status: "Active", joinedAt: "2025-08-27" },
  { id: "cus-016", name: "Layla Haddad", email: "layla.haddad@example.com", phone: "+1 202-555-0116", status: "Active", joinedAt: "2025-09-11" },
  { id: "cus-017", name: "Caleb Nguyen", email: "caleb.nguyen@example.com", phone: "+1 202-555-0117", status: "Active", joinedAt: "2025-10-01" },
  { id: "cus-018", name: "Isla Fraser", email: "isla.fraser@example.com", phone: "+1 202-555-0118", status: "Active", joinedAt: "2025-10-18" },
  { id: "cus-019", name: "Diego Alvarez", email: "diego.alvarez@example.com", phone: "+1 202-555-0119", status: "Inactive", joinedAt: "2025-11-05" },
  { id: "cus-020", name: "Nora Fitzgerald", email: "nora.fitzgerald@example.com", phone: "+1 202-555-0120", status: "Active", joinedAt: "2025-11-23" },
  { id: "cus-021", name: "Tobias Kruger", email: "tobias.kruger@example.com", phone: "+1 202-555-0121", status: "Active", joinedAt: "2025-12-10" },
  { id: "cus-022", name: "Amara Johnson", email: "amara.johnson@example.com", phone: "+1 202-555-0122", status: "Active", joinedAt: "2025-12-28" },
  { id: "cus-023", name: "Felix Novak", email: "felix.novak@example.com", phone: "+1 202-555-0123", status: "Active", joinedAt: "2026-01-15" },
  { id: "cus-024", name: "Ruby Sinclair", email: "ruby.sinclair@example.com", phone: "+1 202-555-0124", status: "Active", joinedAt: "2026-02-02" },
  { id: "cus-025", name: "Ahmed Farouk", email: "ahmed.farouk@example.com", phone: "+1 202-555-0125", status: "Active", joinedAt: "2026-02-20" },
];

export const getCustomerById = (id) => customers.find((c) => c.id === id);
