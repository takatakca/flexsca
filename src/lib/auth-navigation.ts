// Restrict return routes to local customer pages, never an arbitrary redirect.
export function customerReturnPath(value: string | null): string | null {
  return value && /^(?:\/my-requests(?:\/[0-9a-f-]{36})?|\/customer-notifications|\/support(?:\/[0-9a-f-]{36})?)$/i.test(value) ? value : null;
}
export function callbackUrl(search: string) {
  const next = customerReturnPath(new URLSearchParams(search).get('next'));
  return `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`;
}
