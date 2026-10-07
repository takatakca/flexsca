import { verifiedCreditPayment } from "../_shared/payment-policy.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.3";
import Stripe from "npm:stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2025-02-24.acacia",
  });

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Delayed payment methods may complete checkout before money settles.
      if (session.payment_status !== "paid") return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
      const payment = verifiedCreditPayment(session);
      if (!payment) return new Response("Invalid credit payment", { status: 400 });
      const { userId, credits, amountCents, currency } = payment;

      // Use service role client
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Call atomic fulfillment function
      const { data: fulfilled, error } = await supabase.rpc("fulfill_credit_purchase", {
        p_user_id: userId,
        p_session_id: session.id,
        p_payment_intent_id: typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null,
        p_credits: credits,
        p_amount_cents: amountCents,
        p_currency: currency,
      });

      if (error) {
        console.error("Credit fulfillment failed");
        return new Response(JSON.stringify({ error: "Credit fulfillment failed" }), { status: 500 });
      }

      console.log(`Credit fulfillment completed: ${fulfilled}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Webhook verification failed");
    return new Response("Invalid webhook", { status: 400 });
  }
});
