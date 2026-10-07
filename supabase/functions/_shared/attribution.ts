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
