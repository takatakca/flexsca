// Shared rules for calls placed through the phone provider. Pure functions, covered by src/test/calls.test.ts.

/**
 * Accepts only ordinary Canadian and US numbers and returns them as +1XXXXXXXXXX.
 * Premium-rate (900, 976) and special prefixes are refused, so a call can never be
 * sent to a number that bills by the minute.
 */
export function northAmericanNumber(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const digits = input.replace(/[^\d]/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (national.length !== 10) return null;
  const area = national.slice(0, 3), exchange = national.slice(3, 6);
  if (!/^[2-9]\d{2}$/.test(area) || !/^[2-9]\d{2}$/.test(exchange)) return null;
  if (area === "900" || area === "976" || exchange === "976" || /^(\d)\1\1$/.test(area) && area !== "888" && area !== "877" && area !== "866" && area !== "855" && area !== "844" && area !== "833") return null;
  if (area[1] === "1" && area[2] === "1") return null; // 211, 311, 411, 911…
  return `+1${national}`;
}

const escapeXml = (value: string) => value.replace(/[<>&'"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));

/** What the professional hears, then the bridge to the customer. Thirty minutes at most; nothing is recorded. */
export function bridgeTwiml(customerNumber: string, callerId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say language="fr-CA">Appel FLEXS. Nous vous mettons en communication avec votre client.</Say><Say language="en-CA">FLEXS call. Connecting you to your customer.</Say><Dial callerId="${escapeXml(callerId)}" timeout="25" timeLimit="1800"><Number>${escapeXml(customerNumber)}</Number></Dial></Response>`;
}

/** Twilio call states mapped to the states kept in lead_calls. */
export function callState(providerStatus: string): string | null {
  return ({ queued: "queued", initiated: "queued", ringing: "ringing", "in-progress": "in_progress", completed: "completed", busy: "busy", "no-answer": "no_answer", failed: "failed", canceled: "canceled" } as Record<string, string>)[providerStatus] ?? null;
}

/** Twilio signs each webhook: HMAC-SHA1 of the full URL followed by every form field, sorted by name. */
export async function twilioSignature(authToken: string, url: string, params: Record<string, string>): Promise<string> {
  const data = url + Object.keys(params).sort().map(key => key + params[key]).join("");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(authToken), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
  let binary = ""; for (const byte of signature) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Constant-time comparison, so a wrong signature reveals nothing through timing. */
export function sameSignature(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
