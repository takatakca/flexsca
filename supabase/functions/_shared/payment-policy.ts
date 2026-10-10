export const CREDIT_PACKAGES: Record<string, { credits: number; amountCents: number; label: string }> = {
  pack_20: { credits: 20, amountCents: 1900, label: '20 Credits' },
  pack_50: { credits: 50, amountCents: 3900, label: '50 Credits' },
  pack_120: { credits: 120, amountCents: 7900, label: '120 Credits' },
};

export function allowedCheckoutOrigin(value: unknown, configured: string): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    const allowed = configured.split(',').map(s => s.trim()).filter(Boolean);
    return url.protocol === 'https:' && allowed.includes(url.origin) ? url.origin : null;
  } catch { return null; }
}

export interface CheckoutPayment {
  payment_status: string;
  mode: string | null;
  amount_total: number | null;
  currency: string | null;
  metadata: Record<string, string> | null;
}

export function verifiedCreditPayment(session: CheckoutPayment) {
  const pkg = CREDIT_PACKAGES[session.metadata?.package_id ?? ''];
  const userId = session.metadata?.user_id;
  if (session.payment_status !== 'paid' || session.mode !== 'payment' || !pkg || !userId
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)
    || session.metadata?.credits !== String(pkg.credits)
    || session.amount_total !== pkg.amountCents || session.currency !== 'cad') return null;
  return { userId, credits: pkg.credits, amountCents: pkg.amountCents, currency: 'cad' };
}
