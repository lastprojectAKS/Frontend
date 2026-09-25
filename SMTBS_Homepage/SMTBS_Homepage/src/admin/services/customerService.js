import { supabase } from "../../lib/supabaseClient";

// Same revenue rule the mock used: only paid, still-confirmed bookings count
// toward spend — a refunded or cancelled booking shouldn't inflate a
// customer's totals even though the row still exists.
const isRevenueCountable = (b) => b.payment_status === "Paid" && b.booking_status === "Confirmed";

function mapProfileRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    joinedAt: row.member_since,
  };
}

// Stats are derived from real bookings every time, not stored on the
// profile — same reasoning as the mock's comment: two copies of the same
// number can drift, one can't.
function computeStats(bookingsForCustomer) {
  const countable = bookingsForCustomer.filter(isRevenueCountable);
  const totalSpent = countable.reduce((sum, b) => sum + Number(b.amount), 0);
  const lastBooking = bookingsForCustomer.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

  const genreCounts = new Map();
  bookingsForCustomer.forEach((b) => {
    (b.movie?.genres ?? []).forEach((g) => genreCounts.set(g, (genreCounts.get(g) || 0) + 1));
  });
  const favouriteGenres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);

  return {
    totalBookings: bookingsForCustomer.length,
    totalSpent: Math.round(totalSpent * 100) / 100,
    lastBookingDate: lastBooking?.created_at ?? null,
    favouriteGenres,
  };
}

export async function listCustomers() {
  const [{ data: profiles, error: pError }, { data: bookings, error: bError }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "customer").order("member_since", { ascending: false }),
    supabase.from("bookings").select("customer_id, amount, payment_status, booking_status, created_at, movie:movies(genres)"),
  ]);
  if (pError) throw pError;
  if (bError) throw bError;

  const bookingsByCustomer = new Map();
  for (const b of bookings) {
    if (!bookingsByCustomer.has(b.customer_id)) bookingsByCustomer.set(b.customer_id, []);
    bookingsByCustomer.get(b.customer_id).push(b);
  }

  return profiles.map((row) => ({ ...mapProfileRow(row), ...computeStats(bookingsByCustomer.get(row.id) ?? []) }));
}

export async function getCustomer(id) {
  const { data: row, error } = await supabase.from("profiles").select("*").eq("id", id).eq("role", "customer").maybeSingle();
  if (error) throw error;
  if (!row) throw new Error(`Customer "${id}" not found.`);

  const { data: bookings, error: bError } = await supabase
    .from("bookings")
    .select("*, booking_seats(seat_label), movie:movies(id,title,genres), cinema:cinemas(id,name)")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });
  if (bError) throw bError;

  const history = bookings.map((b) => ({
    id: b.id,
    bookingCode: b.booking_code,
    movieId: b.movie_id,
    cinemaId: b.cinema_id,
    date: b.show_date,
    startTime: b.start_time?.slice(0, 5),
    seats: (b.booking_seats ?? []).map((s) => s.seat_label),
    amount: Number(b.amount),
    paymentStatus: b.payment_status,
    bookingStatus: b.booking_status,
    createdAt: b.created_at,
    movie: b.movie,
    cinema: b.cinema,
  }));

  return { ...mapProfileRow(row), ...computeStats(bookings), history };
}

export async function setCustomerStatus(id, status) {
  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
  if (error) throw error;
  return getCustomer(id);
}
