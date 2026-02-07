import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-12-18.acacia",
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

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.user_id;
      const credits = parseInt(session.metadata?.credits || "0", 10);

      if (!userId || !credits) {
        console.error("Missing metadata in checkout session:", session.id);
        return new Response("Missing metadata", { status: 400 });
      }

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
        p_amount_cents: session.amount_total || 0,
        p_currency: session.currency || "cad",
      });

      if (error) {
        console.error("fulfill_credit_purchase error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }

      console.log(`Checkout ${session.id} fulfilled=${fulfilled} for user=${userId} credits=${credits}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
