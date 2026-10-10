import { CREDIT_PACKAGES, allowedCheckoutOrigin } from "../_shared/payment-policy.ts";
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

  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Parse request
    const { packageId, origin: requestedOrigin } = await req.json();
    const origin = allowedCheckoutOrigin(requestedOrigin, Deno.env.get("FLEXS_ALLOWED_ORIGINS") ?? "https://flexs.ca,https://www.flexs.ca");
    if (!origin) return new Response(JSON.stringify({ error: "Invalid checkout origin" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const pkg = CREDIT_PACKAGES[packageId];
    if (!pkg) {
      return new Response(JSON.stringify({ error: "Invalid package" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Stripe checkout session
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-02-24.acacia",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: { name: pkg.label },
            unit_amount: pkg.amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: userId,
        credits: String(pkg.credits),
        package_id: packageId,
      },
      success_url: `${origin}/app/settings?purchase=success`,
      cancel_url: `${origin}/app/settings?purchase=cancel`,
    });

    // Record the pending purchase
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: purchaseError } = await serviceClient.from("credit_purchases").insert({
      user_id: userId,
      stripe_checkout_session_id: session.id,
      credits: pkg.credits,
      amount_cents: pkg.amountCents,
      currency: "cad",
      status: "created",
    });

    if (purchaseError) {
      await stripe.checkout.sessions.expire(session.id);
      throw new Error("Unable to record checkout");
    }
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("create-checkout-session failed");
    return new Response(JSON.stringify({ error: "Unable to create checkout. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
