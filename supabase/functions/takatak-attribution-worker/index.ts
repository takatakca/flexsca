import { createClient } from 'npm:@supabase/supabase-js@2.95.3';
import { attributionEndpoint, attributionPayload, sameToken, type AttributionJob } from '../_shared/attribution.ts';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const workerToken = (Deno.env.get('FLEXS_WORKER_TOKEN') ?? '').trim();
  if (workerToken.length < 32) return new Response('Worker not configured', { status: 503 });
  const authorization = req.headers.get('authorization') ?? '';
  if (!authorization.startsWith('Bearer ') || !sameToken(workerToken, authorization.slice(7))) {
    return new Response('Unauthorized', { status: 401 });
  }
  const token = (Deno.env.get('ADS_FLEXS_SERVICE_TOKEN') ?? '').trim();
  if (token.length < 32) return new Response('Attribution not configured', { status: 503 });
  try {
    const endpoint = attributionEndpoint(Deno.env.get('TAKATAK_BASE_URL') ?? 'https://takatak.ca');
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data, error } = await db.rpc('claim_attribution_batch', { p_limit: 5 });
    if (error) throw error;
    let delivered = 0, failed = 0;
    for (const job of (data ?? []) as AttributionJob[]) {
      let status = 0, success = false;
      try {
        const response = await fetch(endpoint, {
          method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify(attributionPayload(job)), signal: AbortSignal.timeout(10_000), redirect: 'error',
        });
        status = response.status;
        // HTTP 200 alone is insufficient: the documented contract returns ok.
        success = response.ok && (await response.json()).ok === true;
      } catch { /* Persist retry state; never log tokens or remote bodies. */ }
      const { error: completionError } = await db.rpc('complete_attribution', {
        p_id: job.id, p_lease_id: job.lease_id, p_status: status, p_success: success,
      });
      if (completionError) throw completionError;
      if (success) delivered++; else failed++;
    }
    return Response.json({ delivered, failed });
  } catch {
    return Response.json({ error: 'Attribution batch failed' }, { status: 500 });
  }
});
