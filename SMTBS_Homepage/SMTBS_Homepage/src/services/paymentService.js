import { supabase } from "../lib/supabaseClient";
import { invokeFunction } from "../lib/invokeFunction";

export async function createPaymentIntent(showtimeId, seatLabels, redeemPoints = false, offerCode = null) {
  const data = await invokeFunction("create-payment-intent", { showtimeId, seatLabels, redeemPoints, offerCode });
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
