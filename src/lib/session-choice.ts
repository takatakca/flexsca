// "Keep me signed in": when it is unticked the sign-in lasts only while the browser tab session lasts.
const FLAG = "flexs.session-only";
const TAB = "flexs.tab-alive";

export function rememberSessionChoice(keepSignedIn: boolean) {
  try {
    if (keepSignedIn) { localStorage.removeItem(FLAG); sessionStorage.removeItem(TAB); }
    else { localStorage.setItem(FLAG, "1"); sessionStorage.setItem(TAB, "1"); }
  } catch { /* Storage can be unavailable; the default (stay signed in) then applies. */ }
}

/** Call once before the app starts: drops a session-only sign-in left over from a closed browser session. */
export function enforceSessionChoice() {
  try {
    if (localStorage.getItem(FLAG) !== "1" || sessionStorage.getItem(TAB) === "1") return;
    for (const key of Object.keys(localStorage)) if (/^sb-.*-auth-token$/.test(key)) localStorage.removeItem(key);
    localStorage.removeItem(FLAG);
  } catch { /* nothing to enforce */ }
}
