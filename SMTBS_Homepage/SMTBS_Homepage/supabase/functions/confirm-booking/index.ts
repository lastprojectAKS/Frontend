// Verifies a Stripe PaymentIntent server-side (never trusts the client's own
// claim that payment "succeeded") and only then calls book_seats() to turn
// it into a real booking. Two outcomes beyond plain success:
//
// - Same payment_intent_id submitted twice (double-click, retry): book_seats
//   raises 23505 on the unique bookings.payment_intent_id constraint. That's
//   treated as an idempotent replay, not an error — the existing booking is
//   looked up and returned.
// - book_seats fails for any other reason (almost always the seat-race
//   P0001 from its own exception block): the PaymentIntent is refunded
//   before the error is returned, so the customer is never charged for a
//   booking that doesn't exist.
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
    if (!user) return json({ error: "Sign in to book tickets." }, 401);

    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) return json({ error: "Missing payment intent." }, 400);

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== "succeeded") {
      return json({ error: "Payment was not completed. Please try again." });
    }
    if (intent.metadata.customer_id !== user.id) {
      return json({ error: "This payment does not belong to the signed-in account." }, 403);
    }

    const showtimeId = intent.metadata.showtime_id;
    const seatLabels = JSON.parse(intent.metadata.seat_labels ?? "[]");
    const pointsRedeemed = parseInt(intent.metadata.points_redeemed ?? "0", 10);

    const { data: booking, error } = await supabase.rpc("book_seats", {
      p_showtime_id: showtimeId,
      p_seat_labels: seatLabels,
      p_payment_intent_id: paymentIntentId,
      p_points_redeemed: pointsRedeemed,
    });

    if (error) {
      if (error.code === "23505") {
        const { data: existing } = await supabase
          .from("bookings")
          .select("*")
          .eq("payment_intent_id", paymentIntentId)
          .single();
        if (existing) return json({ booking: existing });
      }

      try {
        await stripe.refunds.create({ payment_intent: paymentIntentId });
      } catch (refundErr) {
        console.error("Refund failed after booking error:", refundErr);
        return json({
          error: `Payment succeeded and the booking failed, but the automatic refund also failed. Contact support with reference ${paymentIntentId}.`,
        });
      }

      return json({ error: error.message || "Could not complete your booking. Your payment has been refunded." });
    }

    return json({ booking });
  } catch (err) {
    console.error(err);
    return json({ error: "Could not confirm your booking. Please try again." }, 500);
  }
});
