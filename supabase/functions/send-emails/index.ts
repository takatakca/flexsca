import { createClient } from "npm:@supabase/supabase-js@2.95.3";
import { renderEmail } from "../_shared/emails.ts";
import { sameSignature } from "../_shared/calls.ts";

// Delivers queued emails (public.email_outbox) through Resend.
// Called by the database when an email is queued and every five minutes for retries; the caller
// must present the secret kept in public.email_settings. Needs the function secret RESEND_API_KEY;
// EMAIL_FROM is optional (default "FLEXS <no-reply@flexs.ca>"). Without the key nothing is taken from the queue.
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: settings } = await admin.from("email_settings").select("worker_secret").maybeSingle();
  const presented = req.headers.get("x-flexs-worker") ?? "";
  if (!settings?.worker_secret || !sameSignature(settings.worker_secret, presented)) return new Response("Unauthorized", { status: 401 });

  const apiKey = (Deno.env.get("RESEND_API_KEY") ?? "").trim();
  const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  if (!apiKey) return json({ enabled: false });
  const from = (Deno.env.get("EMAIL_FROM") ?? "").trim() || "FLEXS <no-reply@flexs.ca>";

  const { data: batch, error } = await admin.rpc("claim_email_batch", { p_limit: 20 });
  if (error) { console.error("send-emails claim failed", error.code); return new Response("Error", { status: 500 }); }
  let sent = 0, failed = 0, dropped = 0;
  for (const row of (batch ?? []) as { id: string; kind: string; user_id: string | null; to_email: string | null; lead_id: string | null; payload: Record<string, unknown> }[]) {
    const message = renderEmail(row);
    let to = row.to_email;
    if (!to && row.user_id) {
      const { data: account } = await admin.auth.admin.getUserById(row.user_id);
      to = account?.user?.email_confirmed_at ? account.user.email ?? null : null;
    }
    if (!message || !to) { await admin.rpc("complete_email", { p_id: row.id, p_sent: false, p_retry: false }); dropped++; continue; }
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `flexs-${row.id}` },
        body: JSON.stringify({ from, to: [to], subject: message.subject, text: message.text, html: message.html }),
        signal: AbortSignal.timeout(10_000),
      });
      // A refused address or message (4xx) is not retried; a provider outage or rate limit is.
      const retry = response.status === 429 || response.status >= 500;
      await admin.rpc("complete_email", { p_id: row.id, p_sent: response.ok, p_retry: retry });
      if (response.ok) sent++; else { failed++; console.error("send-emails provider refused", response.status); }
    } catch (error) {
      console.error("send-emails failed", error instanceof Error ? error.name : "unknown");
      await admin.rpc("complete_email", { p_id: row.id, p_sent: false, p_retry: true });
      failed++;
    }
  }
  return json({ enabled: true, sent, failed, dropped });
});
