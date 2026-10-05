-- Seat bookings used to be callable by any signed-in customer, which let someone
-- book seats without paying. Customers can no longer call book_seats(); bookings
-- are created only by the server, after Stripe confirms the payment:
--   - confirm-booking (checkout) and stripe-webhook call book_seats_for_customer()
--     with the service role, using a payment verified with Stripe
-- book_seats_for_customer() was already service-role only (0027).

revoke all on function public.book_seats(uuid, text[], text, integer, text) from public, anon, authenticated;
