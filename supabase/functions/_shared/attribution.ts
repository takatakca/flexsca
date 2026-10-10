export interface AttributionJob {
  id: string;
  lead_id: string;
  attribution_id: string;
  event_type: string;
  occurred_at: string;
  lease_id: string;
}
// An explicit projection prevents accidental disclosure if the schema expands.
export function attributionPayload(job: AttributionJob) {
  return {
    attributionId: job.attribution_id,
    externalEventId: `flexs:${job.id}`,
    eventType: job.event_type,
    sourceReference: job.lead_id,
    occurredAt: job.occurred_at,
  };
}
export function attributionEndpoint(base: string) {
  const url = new URL(base);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('TAKATAK_BASE_URL must be an HTTPS origin');
  }
  return new URL('/api/integrations/ads/flexs/events', url).toString();
}
export function sameToken(expected: string, received: string) {
  const a = new TextEncoder().encode(expected), b = new TextEncoder().encode(received);
  let difference = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ (b[i] ?? 0);
  return difference === 0 && a.length >= 32;
}

// Do not buffer an unbounded remote body or accept HTTP success without its contract.
export async function acceptedAttributionResponse(response: Response, maxBytes = 16_000) {
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    return false;
  }
  const length = response.headers.get('content-length');
  if (length !== null && Number(length) > maxBytes) {
    await response.body.cancel();
    return false;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) { await reader.cancel(); return false; }
      chunks.push(value);
    }
    const joined = new Uint8Array(bytes);
    let position = 0;
    for (const chunk of chunks) { joined.set(chunk, position); position += chunk.byteLength; }
    const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(joined));
    return body !== null && typeof body === 'object' && !Array.isArray(body) && body.ok === true;
  } catch {
    try { await reader.cancel(); } catch { /* Remote stream already closed. */ }
    return false;
  } finally { reader.releaseLock(); }
}

export function attributionCompletionOutcome(persisted: boolean, accepted: boolean) {
  return !persisted ? 'stale' : accepted ? 'delivered' : 'failed';
}
