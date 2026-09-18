// Flat per-booking fee, added once per booking regardless of seat count.
//
// This MUST match the flat fee added in the `book_seats()` Postgres function
// (supabase/migrations/0007_bookings_and_seats.sql, reaffirmed in 0009):
//   update public.bookings set amount = round(v_total + 2.5, 2) ...
// The value here only drives the pre-confirmation estimate shown in the
// seat-selection/checkout UI — the amount actually charged always comes
// back from book_seats() itself (see BookingSuccess/Checkout using
// `booking.amount`), so a mismatch here would show a wrong estimate, not
// a wrong charge. Still, keep the two in sync if this ever changes.
export const BOOKING_FEE = 2.5;
