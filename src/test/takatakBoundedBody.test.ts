import { describe, expect, it } from "vitest";
import { readBoundedUtf8Body } from "../../supabase/functions/_shared/bounded-body";

function makeRequest(bytes: Uint8Array[], headers?: HeadersInit) {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of bytes) controller.enqueue(chunk);
      controller.close();
    },
  });
  return new Request("https://flexs.ca/integration", {
    method: "POST",
    headers,
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

describe("bounded TAKATAK integration request body", () => {
  const encoder = new TextEncoder();

  it("accepts a body exactly at its byte limit", async () => {
    expect(await readBoundedUtf8Body(makeRequest([encoder.encode("abcd")]), 4))
      .toEqual({ ok: true, body: "abcd" });
  });

  it("counts UTF-8 bytes rather than JavaScript character length", async () => {
    const request = makeRequest([encoder.encode("é")]);
    expect(await readBoundedUtf8Body(request, 1))
      .toEqual({ ok: false, error: "too_large" });
  });

  it("correctly decodes multibyte text split across chunks", async () => {
    expect(await readBoundedUtf8Body(
      makeRequest([new Uint8Array([0xc3]), new Uint8Array([0xa9])]),
      2,
    )).toEqual({ ok: true, body: "é" });
  });

  it("rejects streaming over-limit bodies even without Content-Length", async () => {
    expect(await readBoundedUtf8Body(
      makeRequest([encoder.encode("1234"), encoder.encode("5")]),
      4,
    )).toEqual({ ok: false, error: "too_large" });
  });

  it("rejects an oversized Content-Length header without reading the stream", async () => {
    expect(await readBoundedUtf8Body(
      makeRequest([encoder.encode("x")], { "content-length": "18001" }),
      18000,
    )).toEqual({ ok: false, error: "too_large" });
  });

  it("rejects malformed UTF-8 rather than changing the signed payload", async () => {
    expect(await readBoundedUtf8Body(
      makeRequest([new Uint8Array([0xc3, 0x28])]),
      10,
    )).toEqual({ ok: false, error: "invalid_body" });
  });

  it("permits an empty body for the caller to reject as invalid JSON", async () => {
    const req = new Request("https://flexs.ca/integration", { method: "POST" });
    expect(await readBoundedUtf8Body(req, 10)).toEqual({ ok: true, body: "" });
  });
});
