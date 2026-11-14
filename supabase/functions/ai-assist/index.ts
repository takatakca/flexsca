import Anthropic from "npm:@anthropic-ai/sdk@1.8.0";
import { createClient } from "npm:@supabase/supabase-js@2.95.3";
import { DAILY_LIMIT, cleanDraft, leadBrief, quoteReplySystemPrompt } from "../_shared/ai-assist.ts";

// AI drafting for professionals. Drafts only: nothing is sent, charged or changed by this function.
// The provider key stays on the server (ANTHROPIC_API_KEY function secret). Without it the feature reports "not enabled".
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const url = Deno.env.get("SUPABASE_URL")!;
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await asUser.auth.getUser(authHeader.replace("Bearer ", ""));
  if (userError || !userData?.user) return json({ error: "Unauthorized" }, 401);
  const userId = userData.user.id;

  const body = await req.json().catch(() => null);
  const apiKey = (Deno.env.get("ANTHROPIC_API_KEY") ?? "").trim();
  if (body?.task === "status") return json({ enabled: apiKey.length > 0, dailyLimit: DAILY_LIMIT }, 200);
  if (body?.task !== "quote_reply" || typeof body.leadId !== "string" || !UUID.test(body.leadId)) {
    return json({ error: "Invalid request" }, 400);
  }
  if (!apiKey) return json({ error: "AI drafting is not enabled", code: "not_enabled" }, 503);

  // Read the request as the signed-in user: the view only returns the description to a professional who unlocked it.
  const { data: lead, error: leadError } = await asUser.from("leads_safe")
    .select("category, city, details, answers, is_urgent").eq("id", body.leadId).maybeSingle();
  if (leadError) return json({ error: "Unable to read this request" }, 500);
  if (!lead || lead.details === null) return json({ error: "Unlock this request before drafting a reply", code: "not_unlocked" }, 403);
  const { data: provider } = await asUser.from("provider_profiles").select("company_name").eq("user_id", userId).maybeSingle();

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: allowed, error: allowanceError } = await admin.rpc("consume_ai_assist", { p_user_id: userId, p_daily_limit: DAILY_LIMIT });
  if (allowanceError) return json({ error: "Unable to check the daily limit" }, 500);
  if (!allowed) return json({ error: `Daily limit of ${DAILY_LIMIT} drafts reached`, code: "limit_reached" }, 429);
  const refund = () => admin.rpc("refund_ai_assist", { p_user_id: userId });

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "low" },
      // If the model declines for a policy reason, the API retries on Anthropic's recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: quoteReplySystemPrompt(provider?.company_name ?? null),
      messages: [{
        role: "user",
        content: leadBrief({
          category: lead.category, city: lead.city, details: lead.details,
          answers: (lead.answers ?? {}) as Record<string, unknown>, isUrgent: Boolean(lead.is_urgent),
        }),
      }],
    });
    if (response.stop_reason === "refusal") {
      await refund();
      return json({ error: "A draft could not be written for this request", code: "declined" }, 422);
    }
    const text = response.content.map((block) => (block.type === "text" ? block.text : "")).join("");
    const draft = cleanDraft(text);
    if (!draft) { await refund(); return json({ error: "No draft was produced" }, 502); }
    return json({ draft }, 200);
  } catch (error) {
    await refund();
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("[ai-assist] provider key rejected");
      return json({ error: "AI drafting is not enabled", code: "not_enabled" }, 503);
    }
    if (error instanceof Anthropic.RateLimitError) return json({ error: "AI drafting is busy. Try again in a minute.", code: "busy" }, 429);
    if (error instanceof Anthropic.APIError) {
      console.error(`[ai-assist] provider error ${error.status}`);
      return json({ error: "AI drafting is unavailable right now" }, 502);
    }
    console.error("[ai-assist] failed");
    return json({ error: "AI drafting is unavailable right now" }, 502);
  }
});
