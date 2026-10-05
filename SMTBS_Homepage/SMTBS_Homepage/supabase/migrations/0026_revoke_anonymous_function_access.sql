-- Functions are executable by PUBLIC by default, which includes anonymous
-- visitors. Booking, pricing and trigger functions only need signed-in users
-- (or the server), so anonymous access is removed. is_admin() stays open to
-- anon because row-level security policies evaluate it for anonymous requests.

drop function if exists public.quote_booking(uuid, text[]);

revoke all on function public.book_seats(uuid, text[], text, integer, text) from public, anon;
grant execute on function public.book_seats(uuid, text[], text, integer, text) to authenticated;

revoke all on function public.quote_booking(uuid, text[], boolean, text) from public, anon;
grant execute on function public.quote_booking(uuid, text[], boolean, text) to authenticated;

revoke all on function public.resolve_offer(text, date) from public, anon;
grant execute on function public.resolve_offer(text, date) to authenticated;

revoke all on function public.offer_discount_amount(public.offers, numeric) from public, anon;
grant execute on function public.offer_discount_amount(public.offers, numeric) to authenticated;

revoke all on function public.resolve_seat_category(text, text) from public, anon;
grant execute on function public.resolve_seat_category(text, text) to authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.protect_profile_privileged_columns() from public, anon, authenticated;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
