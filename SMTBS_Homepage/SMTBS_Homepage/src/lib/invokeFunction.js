import { supabase } from "./supabaseClient";

// supabase.functions.invoke() reports any non-2xx response as a generic
// "non-2xx status code" error. The function's own message is in the response
// body, so read it from there to show the customer the real reason.
export async function invokeFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message;
    try {
      const payload = await error.context.json();
      if (payload?.error) message = payload.error;
    } catch {
      // Body wasn't JSON — keep the generic message.
    }
    throw new Error(message || "Something went wrong. Please try again.");
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
