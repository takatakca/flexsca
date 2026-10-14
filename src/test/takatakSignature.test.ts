// @vitest-environment node
import { describe, expect, it } from "vitest";
import { verifyTakatakSignature } from "../../supabase/functions/_shared/takatak-signature";

const secret = "test-secret-with-more-than-32-characters-only";
const integration = "takatak-r2f";
const id = "r2f-master-00001";
const body = JSON.stringify({ opportunityId: id, version: 1 });
const now = Date.parse("2026-10-14T12:00:00Z");
const timestamp = String(Math.floor(now / 1000));
const encoder = new TextEncoder();

async function makeHeaders(
  value: string,
  eventId = id,
  when = timestamp,
  signingSecret = secret,
): Promise<Headers> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${when}.${eventId}.${value}`),
  );
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return new Headers({
    "x-integration-id": integration,
    "x-event-id": eventId,
    "x-timestamp": when,
    "x-signature": `sha256=${hex}`,
  });
}

describe("TAKATAK opportunity HMAC authentication", () => {
  it("accepts the exact signed body, time and external event id", async () => {
    expect(await verifyTakatakSignature(
      await makeHeaders(body), body, integration, secret, now,
    )).toEqual({ ok: true, eventId: id });
  });

  it("rejects a tampered request body", async () => {
    expect(await verifyTakatakSignature(
      await makeHeaders(body), body + " ", integration, secret, now,
    )).toEqual({ ok: false });
  });

  it("rejects the wrong signing secret", async () => {
    expect(await verifyTakatakSignature(
      await makeHeaders(body, id, timestamp, "different-signature-test-secret-123456"),
      body, integration, secret, now,
    )).toEqual({ ok: false });
  });

  it("rejects spoofed integration identifiers", async () => {
    const headers = await makeHeaders(body);
    headers.set("x-integration-id", "another-tenant");
    expect(await verifyTakatakSignature(headers, body, integration, secret, now))
      .toEqual({ ok: false });
  });

  it("binds signatures to the event id", async () => {
    const headers = await makeHeaders(body);
    headers.set("x-event-id", "r2f-master-other");
    expect(await verifyTakatakSignature(headers, body, integration, secret, now))
      .toEqual({ ok: false });
  });

  it("rejects stale and future timestamps outside five minutes", async () => {
    const headers = await makeHeaders(body);
    expect(await verifyTakatakSignature(headers, body, integration, secret, now + 301000))
      .toEqual({ ok: false });
    expect(await verifyTakatakSignature(headers, body, integration, secret, now - 301000))
      .toEqual({ ok: false });
  });

  it("rejects malformed timestamps and signatures", async () => {
    const headers = await makeHeaders(body);
    headers.set("x-timestamp", "not-a-time");
    expect(await verifyTakatakSignature(headers, body, integration, secret, now))
      .toEqual({ ok: false });
    headers.set("x-timestamp", timestamp);
    headers.set("x-signature", "sha256=invalid");
    expect(await verifyTakatakSignature(headers, body, integration, secret, now))
      .toEqual({ ok: false });
  });

  it("rejects missing or oversized identifiers and short server secrets", async () => {
    const headers = await makeHeaders(body);
    headers.delete("x-event-id");
    expect(await verifyTakatakSignature(headers, body, integration, secret, now))
      .toEqual({ ok: false });
    headers.set("x-event-id", "x".repeat(161));
    expect(await verifyTakatakSignature(headers, body, integration, secret, now))
      .toEqual({ ok: false });
    expect(await verifyTakatakSignature(await makeHeaders(body), body, integration, "weak", now))
      .toEqual({ ok: false });
  });
});
