// Cancels a booking and, when the owner cancels their own paid booking,
// refunds it through Stripe. Cancellation and refund run in this order: the
// database cancel first (it enforces the cutoff and the points rule), then
// the refund. If the refund fails after the cancel, the booking is left
// Cancelled-but-Paid, which refund-booking already knows how to finish.
//
// Admins cancelling someone else's booking get the admin override (no cutoff,
// no automatic refund — the admin refunds separately, as before).
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
    if (!user) return json({ error: "Sign in to manage bookings." }, 401);

    const { bookingId } = await req.json();
    if (!bookingId) return json({ error: "Missing booking id." }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: booking, error: fetchError } = await admin
      .from("bookings")
      .select("id, customer_id, payment_status, payment_intent_id")
      .eq("id", bookingId)
      .maybeSingle();
    if (fetchError) return json({ error: fetchError.message }, 500);
    if (!booking) return json({ error: "Booking not found." }, 404);

    const { data: isAdmin } = await userClient.rpc("is_admin");
    const isOwner = booking.customer_id === user.id;
    if (!isOwner && !isAdmin) return json({ error: "You can only cancel your own bookings." }, 403);

    const adminOverride = Boolean(isAdmin) && !isOwner;
    const { error: cancelError } = await admin.rpc("cancel_booking_as", {
      p_booking_id: bookingId,
      p_actor: user.id,
      p_admin_override: adminOverride,
    });
    if (cancelError) return json({ error: cancelError.message }, 400);

    if (isOwner && booking.payment_status === "Paid" && booking.payment_intent_id) {
      try {
        await stripe.refunds.create({ payment_intent: booking.payment_intent_id });
      } catch (err) {
        if (err?.code !== "charge_already_refunded") {
          console.error("Stripe refund failed after cancel:", err);
          return json({
            error: `Your booking was cancelled, but the refund could not be processed. Contact support with reference ${bookingId}.`,
          }, 502);
        }
      }
      await admin.from("bookings").update({ payment_status: "Refunded" }).eq("id", bookingId);
    }

    const { data: updated, error: readError } = await admin.from("bookings").select("*").eq("id", bookingId).single();
    if (readError) return json({ error: readError.message }, 500);
    return json({ booking: updated });
  } catch (err) {
    console.error(err);
    return json({ error: "Could not cancel the booking. Please try again." }, 500);
  }
});
