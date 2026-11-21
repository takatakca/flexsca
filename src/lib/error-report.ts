import { supabase } from "@/integrations/supabase/client";

let sent = 0;
const seen = new Set<string>();

/**
 * Sends an error that happened in the browser to the owner's error log.
 * No personal data: the message, the code location, the page path without its query, the browser.
 * At most five per page load, each distinct error once, and never throws.
 */
export function reportError(error: unknown, context?: string) {
  try {
    const message = `${context ? `${context}: ` : ""}${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`.slice(0, 300);
    // Noise that is not a fault of the site: extensions, cancelled navigations, a lost connection.
    if (!message || /ResizeObserver loop|Script error\.?$|Load failed|Failed to fetch|NetworkError|AbortError|chrome-extension|moz-extension/i.test(message)) return;
    if (sent >= 5 || seen.has(message)) return;
    seen.add(message); sent++;
    const stack = error instanceof Error && error.stack ? error.stack.replace(/https?:\/\/[^/\s)]+/g, "").slice(0, 2000) : null;
    void supabase.rpc("report_client_error" as never, { p_message: message, p_stack: stack, p_path: window.location.pathname, p_agent: navigator.userAgent.slice(0, 200) } as never).then(() => undefined, () => undefined);
  } catch { /* reporting must never break the page */ }
}

/** Catches what no component caught: script errors and rejected promises. */
export function watchErrors() {
  window.addEventListener("error", event => reportError(event.error ?? event.message, "window"));
  window.addEventListener("unhandledrejection", event => reportError(event.reason, "promise"));
}
