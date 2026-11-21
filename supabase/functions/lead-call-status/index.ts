import { createClient } from "npm:@supabase/supabase-js@2.95.3";
import { callState, sameSignature, twilioSignature } from "../_shared/calls.ts";

// Receives call progress from the phone provider and updates the call log.
// Every request must carry a valid Twilio signature; anything else is refused.
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const token = (Deno.env.get("TWILIO_AUTH_TOKEN") ?? "").trim();
  if (!token) return new Response("Not configured", { status: 503 });

  const raw = await req.text();
  if (raw.length > 20_000) return new Response("Too large", { status: 413 });
  const params: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(raw)) params[key] = value;

  const publicUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/lead-call-status`;
  const expected = await twilioSignature(token, publicUrl, params);
  if (!sameSignature(expected, req.headers.get("X-Twilio-Signature") ?? "")) return new Response("Forbidden", { status: 403 });

  const state = callState(params.CallStatus ?? "");
  const sid = params.CallSid ?? "";
  if (!state || !/^CA[0-9a-f]{32}$/i.test(sid)) return new Response("Ignored", { status: 200 });
  const duration = /^\d{1,6}$/.test(params.CallDuration ?? "") ? Number(params.CallDuration) : null;

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { error } = await admin.rpc("record_lead_call", { p_call_id: null, p_provider_sid: sid, p_status: state, p_duration: duration });
  if (error) { console.error("lead-call-status update failed", error.code); return new Response("Error", { status: 500 }); }
  return new Response("OK", { status: 200 });
});
