// Admin-only. Cancels a showtime: the showtime is closed to new bookings first,
// then every confirmed booking on it is cancelled (admin override, so no
// cutoff applies and points are clamped at zero) and refunded through Stripe.
// A refund that fails leaves that booking Cancelled-but-Paid, which
// refund-booking can finish; the response lists those so nothing is missed.
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@23";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Sign in required." }, 401);

    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) return json({ error: "Only admins can cancel showtimes." }, 403);

    const { showtimeId } = await req.json();
    if (!showtimeId) return json({ error: "Missing showtime id." }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: showtime, error: showtimeError } = await admin
      .from("showtimes")
      .select("id, status")
      .eq("id", showtimeId)
      .maybeSingle();
    if (showtimeError) return json({ error: showtimeError.message }, 500);
    if (!showtime) return json({ error: "Showtime not found." }, 404);
    if (showtime.status === "Cancelled") return json({ error: "This showtime is already cancelled." }, 400);

    const { error: closeError } = await admin.from("showtimes").update({ status: "Cancelled" }).eq("id", showtimeId);
    if (closeError) return json({ error: closeError.message }, 500);

    const { data: bookings, error: bookingsError } = await admin
      .from("bookings")
      .select("id, payment_status, payment_intent_id")
      .eq("showtime_id", showtimeId)
      .eq("booking_status", "Confirmed");
    if (bookingsError) return json({ error: bookingsError.message }, 500);

    let cancelled = 0;
    let refunded = 0;
    const failures: { bookingId: string; reason: string }[] = [];

    for (const booking of bookings ?? []) {
      const { error: cancelError } = await admin.rpc("cancel_booking_as", {
        p_booking_id: booking.id,
        p_actor: user.id,
        p_admin_override: true,
      });
      if (cancelError) {
        failures.push({ bookingId: booking.id, reason: cancelError.message });
        continue;
      }
      cancelled++;

      if (booking.payment_status !== "Paid" || !booking.payment_intent_id) continue;
      try {
        await stripe.refunds.create({ payment_intent: booking.payment_intent_id });
      } catch (err) {
        if (err?.code !== "charge_already_refunded") {
          console.error("Stripe refund failed during showtime cancel:", err);
          failures.push({ bookingId: booking.id, reason: "Stripe refund failed" });
          continue;
        }
      }
      const { error: flipError } = await admin.from("bookings").update({ payment_status: "Refunded" }).eq("id", booking.id);
      if (flipError) {
        failures.push({ bookingId: booking.id, reason: flipError.message });
        continue;
      }
      refunded++;
    }

    return json({ cancelled, refunded, failures });
  } catch (err) {
    console.error(err);
    return json({ error: "Could not cancel the showtime. Please try again." }, 500);
  }
});
