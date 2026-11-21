import { createClient } from "npm:@supabase/supabase-js@2.95.3";
import { bridgeTwiml, northAmericanNumber } from "../_shared/calls.ts";

// Calls between a professional and the customer of a request they unlocked.
// FLEXS rings the professional first, then connects the customer; the customer sees the FLEXS number.
// Needs three function secrets: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER (the MIMT / Twilio line).
// Without them the feature reports "not enabled" and the app hides its button.
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

  const sid = (Deno.env.get("TWILIO_ACCOUNT_SID") ?? "").trim();
  const token = (Deno.env.get("TWILIO_AUTH_TOKEN") ?? "").trim();
  const from = northAmericanNumber(Deno.env.get("TWILIO_FROM_NUMBER") ?? "");
  const enabled = sid.length > 0 && token.length > 0 && from !== null;

  const body = await req.json().catch(() => null);
  if (body?.task === "status") return json({ enabled }, 200);
  if (body?.task !== "call" || typeof body.leadId !== "string" || !UUID.test(body.leadId)) return json({ error: "Invalid request" }, 400);
  if (!enabled) return json({ error: "Calls are not enabled", code: "not_enabled" }, 503);

  const proNumber = northAmericanNumber(body.phone);
  if (!proNumber) return json({ error: "Enter a valid Canadian or US phone number", code: "bad_number" }, 400);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: granted, error: grantError } = await admin.rpc("authorize_lead_call", { p_pro_id: userData.user.id, p_lead_id: body.leadId });
  if (grantError) {
    const status = grantError.code === "42501" ? 403 : grantError.code === "P0001" ? 429 : grantError.code === "P0002" ? 404 : 500;
    return json({ error: status === 500 ? "Unable to start the call" : grantError.message }, status);
  }
  const call = Array.isArray(granted) ? granted[0] : granted;
  const customerNumber = northAmericanNumber(call?.customer_phone);
  if (!call?.call_id || !customerNumber) {
    if (call?.call_id) await admin.rpc("record_lead_call", { p_call_id: call.call_id, p_provider_sid: null, p_status: "failed" });
    return json({ error: "The customer's number cannot be called from FLEXS", code: "bad_customer_number" }, 422);
  }

  const form = new URLSearchParams({
    To: proNumber,
    From: from!,
    Twiml: bridgeTwiml(customerNumber, from!),
    StatusCallback: `${url}/functions/v1/lead-call-status`,
    StatusCallbackMethod: "POST",
  });
  for (const event of ["initiated", "ringing", "answered", "completed"]) form.append("StatusCallbackEvent", event);

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Calls.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || typeof result?.sid !== "string") {
      console.error("lead-call provider refused", response.status, result?.code);
      await admin.rpc("record_lead_call", { p_call_id: call.call_id, p_provider_sid: null, p_status: "failed" });
      return json({ error: "The phone service could not start the call. Try again shortly." }, 502);
    }
    await admin.rpc("record_lead_call", { p_call_id: call.call_id, p_provider_sid: result.sid, p_status: "queued" });
    return json({ callId: call.call_id, status: "queued" }, 200);
  } catch (error) {
    console.error("lead-call failed", error instanceof Error ? error.name : "unknown");
    await admin.rpc("record_lead_call", { p_call_id: call.call_id, p_provider_sid: null, p_status: "failed" });
    return json({ error: "The phone service could not start the call. Try again shortly." }, 502);
  }
});
