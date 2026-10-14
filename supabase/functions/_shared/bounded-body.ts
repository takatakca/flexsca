/** Read a signed integration request without buffering an unbounded body in memory. */
export type BoundedBodyResult =
  | { ok: true; body: string }
  | { ok: false; error: "too_large" | "invalid_body" };

export async function readBoundedUtf8Body(
  request: Request,
  maxBytes: number,
): Promise<BoundedBodyResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
    throw new RangeError("maxBytes must be a non-negative safe integer");
  }

  // Reject declared oversize bodies before opening a stream, but enforce the
  // limit while reading too: Content-Length is controlled by the sender.
  const header = request.headers.get("content-length");
  if (header !== null && /^\d+$/.test(header) && Number(header) > maxBytes) {
    return { ok: false, error: "too_large" };
  }

  if (!request.body) return { ok: true, body: "" };
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytesRead = 0;
  let body = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.byteLength > maxBytes - bytesRead) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, error: "too_large" };
      }
      bytesRead += value.byteLength;
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return { ok: true, body };
  } catch {
    return { ok: false, error: "invalid_body" };
  } finally {
    reader.releaseLock();
  }
}
