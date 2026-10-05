// Admin-triggered refund. Before Stripe existed, "refund" was just a DB
// status flip (src/admin/services/bookingService.js used to do it directly
// from the client: cancel_booking() RPC + an update to Refunded). Now that
// real Stripe charges exist, that would leave the DB claiming "Refunded"
// while the customer's card was never actually credited back. This
// function does the same DB work, but only after Stripe confirms the
// refund succeeded (or was already done, for retries).
//
// The admin check happens here, server-side, before any Stripe call — not
// left to RLS alone. RLS (bookings_admin_update) would still block a
// non-admin from the final status flip, but by then a real refund.create()
// call would already have gone out to Stripe. A customer could otherwise
// invoke this function directly (bypassing the UI) on their own paid
// booking — self-cancel is allowed for owners, so cancel_booking() alone
// wouldn't stop them — and get a real refund despite the product never
// exposing that path to customers.
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Sign in required." }, 401);

    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) return json({ error: "Only admins can issue refunds." }, 403);

    const { bookingId } = await req.json();
    if (!bookingId) return json({ error: "Missing booking id." }, 400);

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, payment_status, booking_status, payment_intent_id")
      .eq("id", bookingId)
      .maybeSingle();
    if (fetchError) return json({ error: fetchError.message }, 500);
    if (!booking) return json({ error: "Booking not found." }, 404);

    if (booking.payment_status !== "Paid") {
      return json({ error: "Only paid bookings can be refunded." }, 400);
    }

    // Normal case: still Confirmed, nothing cancelled yet. Retry case: a
    // previous attempt already released the seats (cancel_booking) but
    // failed before the Stripe refund or the final status flip completed —
    // booking_status is Cancelled while payment_status is still Paid. Both
    // are handled; anything else (already Refunded, etc.) is rejected.
    if (booking.booking_status === "Confirmed") {
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { error: cancelError } = await admin.rpc("cancel_booking_as", {
        p_booking_id: bookingId,
        p_actor: user.id,
        p_admin_override: true,
      });
      if (cancelError) return json({ error: cancelError.message }, 400);
    } else if (booking.booking_status !== "Cancelled") {
      return json({ error: `This booking cannot be refunded (status: ${booking.booking_status}).` }, 400);
    }

    if (booking.payment_intent_id) {
      try {
        await stripe.refunds.create({ payment_intent: booking.payment_intent_id });
      } catch (err) {
        // Already refunded on Stripe's side (e.g. a retried request after
        // the first attempt's DB update failed) — not a real failure.
        if (err?.code !== "charge_already_refunded") {
          console.error("Stripe refund failed:", err);
          return json({ error: "Could not refund the payment with Stripe. Please try again or check the Stripe Dashboard." }, 502);
        }
      }
    }
    // No payment_intent_id means this booking predates Stripe — nothing to
    // refund there, just finish the status flip as before.

    const { data: updated, error: updateError } = await supabase
      .from("bookings")
      .update({ payment_status: "Refunded", booking_status: "Refunded" })
      .eq("id", bookingId)
      .select()
      .single();
    if (updateError) return json({ error: updateError.message }, 500);

    return json({ booking: updated });
  } catch (err) {
    console.error(err);
    return json({ error: "Could not process the refund. Please try again." }, 500);
  }
});
