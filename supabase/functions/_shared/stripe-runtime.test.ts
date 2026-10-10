import Stripe from 'npm:stripe@17.7.0';

Deno.test('Stripe signature verification runs with Deno Web Crypto', async () => {
  // Explicit test fixtures; no external request or real payment credential.
  const sdk = new Stripe('sk_test_fixture_only', { apiVersion: '2025-02-24.acacia' });
  const payload = JSON.stringify({ id: 'evt_fixture', object: 'event', type: 'checkout.session.completed', data: { object: {} } });
  const secret = 'whsec_fixture_only';
  const signature = await sdk.webhooks.generateTestHeaderStringAsync({ payload, secret });
  const event = await sdk.webhooks.constructEventAsync(payload, signature, secret);
  if (event.id !== 'evt_fixture') throw new Error('Verified event differs');
  let rejected = false;
  try { await sdk.webhooks.constructEventAsync(payload, signature, 'different_fixture_secret'); }
  catch { rejected = true; }
  if (!rejected) throw new Error('Invalid signature was accepted');
});
