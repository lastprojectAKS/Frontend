import { supabase } from "../lib/supabaseClient";

export async function createPaymentIntent(showtimeId, seatLabels, redeemPoints = false) {
  const { data, error } = await supabase.functions.invoke("create-payment-intent", {
    body: { showtimeId, seatLabels, redeemPoints },
  });
  if (error) throw new Error(error.message || "Could not start payment.");
  if (data?.error) throw new Error(data.error);
  return { clientSecret: data.clientSecret, quote: data.quote };
}

export async function confirmBookingAfterPayment(paymentIntentId) {
  const { data, error } = await supabase.functions.invoke("confirm-booking", {
    body: { paymentIntentId },
  });
  if (error) throw new Error(error.message || "Could not confirm booking.");
  if (data?.error) throw new Error(data.error);
  return data.booking;
}
