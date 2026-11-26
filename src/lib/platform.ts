import { Capacitor } from "@capacitor/core";

/** Canonical public website. Store apps run from a local origin, so links sent by email must point here. */
export const PUBLIC_SITE_ORIGIN = "https://flexs.ca";

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** Origin to embed in emailed links, payment return URLs and shared links. */
export function publicOrigin(): string {
  return isNativeApp() ? PUBLIC_SITE_ORIGIN : window.location.origin;
}

/**
 * Turn an opened https://flexs.ca/... link into an in-app route.
 * Returns null for any other host so a deep link can never navigate the app elsewhere.
 */
export function inAppPathFromUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const allowed = new URL(PUBLIC_SITE_ORIGIN).hostname;
    if (url.protocol !== "https:" || (url.hostname !== allowed && url.hostname !== `www.${allowed}`)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/**
 * Android back button: when a dialog, sheet or menu is open, close it (as Escape would) instead of
 * leaving the page underneath. Returns true when something was open.
 */
export function closeOpenLayer(doc: Document = document): boolean {
  const open = doc.querySelector(
    '[role="dialog"], [role="alertdialog"], [role="menu"][data-state="open"], [role="listbox"][data-state="open"]',
  );
  if (!open) return false;
  const target = doc.activeElement && open.contains(doc.activeElement) ? doc.activeElement : open;
  target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }));
  return true;
}
