// Stripe webhook: safety net for payments whose browser never reached
// confirm-booking (closed tab, dropped connection). When Stripe reports a
// successful payment, the booking is created from the PaymentIntent's own
// metadata, which was set server-side at payment creation.
//
// Idempotent: the unique payment_intent_id on bookings means a payment already
// booked by confirm-booking is simply recognised and skipped. If the seats can
// no longer be booked, the payment is refunded.
//
// Deploy with --no-verify-jwt: Stripe does not send a Supabase JWT, and the
// request is authenticated by its Stripe signature instead.
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@23";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, webhookSecret);
  } catch (err) {
    console.error("Invalid Stripe signature:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded") {
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  }

  const intent = event.data.object as Stripe.PaymentIntent;
  const meta = intent.metadata;
  if (!meta.customer_id || !meta.showtime_id) {
    return new Response(JSON.stringify({ received: true, skipped: "not a booking payment" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await admin.rpc("book_seats_for_customer", {
    p_customer: meta.customer_id,
    p_showtime_id: meta.showtime_id,
    p_seat_labels: JSON.parse(meta.seat_labels ?? "[]"),
    p_payment_intent_id: intent.id,
    p_points_redeemed: parseInt(meta.points_redeemed ?? "0", 10),
    p_offer_code: meta.offer_code || null,
  });

  if (error && error.code !== "23505") {
    console.error("Webhook booking failed, refunding:", intent.id, error.message);
    try {
      await stripe.refunds.create({ payment_intent: intent.id });
    } catch (refundErr) {
      if (refundErr?.code !== "charge_already_refunded") {
        console.error("Refund failed after webhook booking error:", refundErr);
        return new Response("Refund failed", { status: 500 });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
