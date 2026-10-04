// Creates a Stripe PaymentIntent for the authoritative, server-computed
// price of a seat selection. No DB writes and no seat hold happen here —
// same no-hold philosophy book_seats() already uses (see its header comment
// in supabase/migrations/0007_bookings_and_seats.sql): seats are only ever
// claimed at the final book_seats() call, in confirm-booking.
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

    const { showtimeId, seatLabels } = await req.json();
    if (!showtimeId || !Array.isArray(seatLabels) || seatLabels.length === 0) {
      return json({ error: "A showtime and at least one seat are required." }, 400);
    }

    const { data: quote, error: quoteError } = await supabase.rpc("quote_booking", {
      p_showtime_id: showtimeId,
      p_seat_labels: seatLabels,
    });
    if (quoteError) return json({ error: quoteError.message }, 200);

    const amountCents = Math.round(quote.total * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "aud",
      automatic_payment_methods: { enabled: true },
      metadata: {
        showtime_id: showtimeId,
        seat_labels: JSON.stringify(seatLabels),
        customer_id: user.id,
      },
    });

    return json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    return json({ error: "Could not start payment. Please try again." }, 500);
  }
});
