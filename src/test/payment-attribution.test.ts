import { describe, expect, it } from 'vitest';
import { allowedCheckoutOrigin, verifiedCreditPayment } from '../../supabase/functions/_shared/payment-policy';
import { attributionEndpoint, attributionPayload, sameToken } from '../../supabase/functions/_shared/attribution';

describe('payment boundary', () => {
  const paid = { payment_status: 'paid', mode: 'payment', amount_total: 1900, currency: 'cad', metadata: { package_id: 'pack_20', credits: '20', user_id: '11111111-1111-4111-8111-111111111111' } };
  it('rejects unsettled, altered and mismatched checkout payments', () => {
    expect(verifiedCreditPayment(paid)?.credits).toBe(20);
    for (const changed of [{payment_status:'unpaid'},{amount_total:1},{currency:'usd'},{metadata:{...paid.metadata,credits:'120'}},{mode:'subscription'}]) {
      expect(verifiedCreditPayment({...paid,...changed})).toBeNull();
    }
  });
  it('only redirects to explicitly configured HTTPS origins', () => {
    expect(allowedCheckoutOrigin('https://flexs.ca','https://flexs.ca')).toBe('https://flexs.ca');
    for (const value of ['https://evil.test','https://flexs.ca.evil.test','https://flexs.ca@evil.test','http://flexs.ca','https://flexs.ca/path']) {
      expect(allowedCheckoutOrigin(value,'https://flexs.ca')).toBeNull();
    }
  });
});
describe('TakaTak boundary', () => {
  it('projects only opaque attribution fields with stable retry identifiers', () => {
    const job = { id: 'job-id', lead_id: 'lead-id', attribution_id: 'click-id', event_type: 'lead', occurred_at: '2026-10-07T04:00:00Z', lease_id: 'lease', customer_email: 'private@example.test' };
    const payload = attributionPayload(job);
    expect(Object.keys(payload).sort()).toEqual(['attributionId','eventType','externalEventId','occurredAt','sourceReference'].sort());
    expect(attributionPayload({...job,lease_id:'new-lease'})).toEqual(payload);
    expect(JSON.stringify(payload)).not.toContain('private@example.test');
  });
  it('validates server endpoint and scheduler token', () => {
    expect(attributionEndpoint('https://takatak.ca')).toBe('https://takatak.ca/api/integrations/ads/flexs/events');
    expect(() => attributionEndpoint('http://takatak.ca')).toThrow();
    expect(() => attributionEndpoint('https://user:secret@takatak.ca')).toThrow();
    expect(sameToken('a'.repeat(32),'a'.repeat(32))).toBe(true);
    expect(sameToken('a'.repeat(32),'b'.repeat(32))).toBe(false);
    expect(sameToken('short','short')).toBe(false);
  });
});
