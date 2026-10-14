/** HMAC contract for TAKATAK -> FLEXS. Never send the shared secret to clients. */
const encoder = new TextEncoder();
const MAX_AGE_MS = 5 * 60 * 1000;

function hexToBytes(value: string): ArrayBuffer | null {
  if (!/^[a-f0-9]{64}$/i.test(value)) return null;
  const buffer = new ArrayBuffer(32);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < value.length; i += 2) {
    bytes[i / 2] = Number.parseInt(value.slice(i, i + 2), 16);
  }
  return buffer;
}

export async function verifyTakatakSignature(
  headers: Headers,
  rawBody: string,
  integrationId: string,
  secret: string,
  nowMs = Date.now(),
): Promise<{ ok: true; eventId: string } | { ok: false }> {
  const suppliedIntegration = headers.get("x-integration-id")?.trim();
  const eventId = headers.get("x-event-id")?.trim() ?? "";
  const timestamp = headers.get("x-timestamp")?.trim() ?? "";
  const signature = headers.get("x-signature")?.trim().replace(/^sha256=/i, "") ?? "";
  const signatureBytes = hexToBytes(signature);

  if (
    !integrationId ||
    secret.length < 32 ||
    suppliedIntegration !== integrationId ||
    !eventId ||
    eventId.length > 160 ||
    !/^\d{10}$/.test(timestamp) ||
    !signatureBytes
  ) {
    return { ok: false };
  }

  const timestampMs = Number(timestamp) * 1000;
  if (
    !Number.isFinite(timestampMs) ||
    !Number.isFinite(nowMs) ||
    Math.abs(nowMs - timestampMs) > MAX_AGE_MS
  ) {
    return { ok: false };
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(`${timestamp}.${eventId}.${rawBody}`),
  );

  return valid ? { ok: true, eventId } : { ok: false };
}
