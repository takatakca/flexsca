// SMTP settings for notification emails, read from the function secrets. Pure, covered by src/test/emails.test.ts.

export type SmtpSettings =
  | { ok: true; from: string; transport: { host: string; port: number; secure: boolean; auth: { user: string; pass: string } } }
  | { ok: false; reason: string };

/**
 * Reads SMTP_HOST, SMTP_USER, SMTP_PASSWORD, optional SMTP_PORT and EMAIL_FROM.
 * Port 465 (TLS from the first byte) is the default. Supabase functions cannot reach ports 25 and 587,
 * so those two are refused here with a clear reason instead of failing on every send.
 */
export function smtpSettings(env: (name: string) => string | undefined): SmtpSettings {
  const host = (env("SMTP_HOST") ?? "").trim();
  const user = (env("SMTP_USER") ?? "").trim();
  const pass = env("SMTP_PASSWORD") ?? "";
  if (!host || !user || !pass) return { ok: false, reason: "SMTP_HOST, SMTP_USER and SMTP_PASSWORD are not all set" };
  if (!/^[a-z0-9.-]+$/i.test(host)) return { ok: false, reason: "SMTP_HOST must be a host name" };
  const port = Number((env("SMTP_PORT") ?? "465").trim());
  if (!Number.isInteger(port) || port < 1 || port > 65535) return { ok: false, reason: "SMTP_PORT is not a port number" };
  if (port === 25 || port === 587) return { ok: false, reason: `port ${port} cannot be reached from Supabase functions; use 465 (or 2525 if the mail service offers it)` };
  const from = (env("EMAIL_FROM") ?? "").trim() || "FLEXS <no-reply@flexs.ca>";
  if (/[\r\n]/.test(from)) return { ok: false, reason: "EMAIL_FROM must be one line" };
  return { ok: true, from, transport: { host, port, secure: port === 465, auth: { user, pass } } };
}
