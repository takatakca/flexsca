import { createClient } from "npm:@supabase/supabase-js@2.95.3";
import nodemailer from "npm:nodemailer@6.9.16";
import { renderEmail } from "../_shared/emails.ts";
import { smtpSettings } from "../_shared/smtp.ts";
import { sameSignature } from "../_shared/calls.ts";

// Delivers queued emails (public.email_outbox) through the owner's SMTP server. No third-party mail API.
// Called by the database when an email is queued and every five minutes for retries; the caller
// must present the secret kept in public.email_settings.
// Function secrets: SMTP_HOST, SMTP_USER, SMTP_PASSWORD; optional SMTP_PORT (465 by default) and EMAIL_FROM.
// Without them nothing is taken from the queue.
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: settings } = await admin.from("email_settings").select("worker_secret").maybeSingle();
  const presented = req.headers.get("x-flexs-worker") ?? "";
  if (!settings?.worker_secret || !sameSignature(settings.worker_secret, presented)) return new Response("Unauthorized", { status: 401 });

  const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  const smtp = smtpSettings(name => Deno.env.get(name));
  if (!smtp.ok) return json({ enabled: false, reason: smtp.reason });

  const { data: batch, error } = await admin.rpc("claim_email_batch", { p_limit: 20 });
  if (error) { console.error("send-emails claim failed", error.code); return new Response("Error", { status: 500 }); }
  const rows = (batch ?? []) as { id: string; kind: string; user_id: string | null; to_email: string | null; lead_id: string | null; payload: Record<string, unknown> }[];
  if (rows.length === 0) return json({ enabled: true, sent: 0, failed: 0, dropped: 0 });

  const transport = nodemailer.createTransport({ ...smtp.transport, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000 });
  let sent = 0, failed = 0, dropped = 0;
  for (const row of rows) {
    const message = renderEmail(row);
    let to = row.to_email;
    if (!to && row.user_id) {
      const { data: account } = await admin.auth.admin.getUserById(row.user_id);
      to = account?.user?.email_confirmed_at ? account.user.email ?? null : null;
    }
    if (!message || !to) { await admin.rpc("complete_email", { p_id: row.id, p_sent: false, p_retry: false }); dropped++; continue; }
    try {
      await transport.sendMail({ from: smtp.from, to, subject: message.subject, text: message.text, html: message.html, messageId: `<flexs-${row.id}@flexs.ca>` });
      await admin.rpc("complete_email", { p_id: row.id, p_sent: true });
      sent++;
    } catch (error) {
      // A refused recipient or message (5xx reply) is not retried; a connection problem or a temporary refusal (4xx) is.
      const code = Number((error as { responseCode?: number }).responseCode ?? 0);
      console.error("send-emails smtp error", code || (error instanceof Error ? error.name : "unknown"));
      await admin.rpc("complete_email", { p_id: row.id, p_sent: false, p_retry: !(code >= 500 && code < 600) });
      failed++;
    }
  }
  transport.close();
  return json({ enabled: true, sent, failed, dropped });
});
