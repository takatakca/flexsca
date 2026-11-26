import "./lib/zod-config";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { enforceSessionChoice } from "./lib/session-choice";
import { initLanguage } from "./lib/i18n";
import { watchErrors } from "./lib/error-report";
import ErrorBoundary from "./components/ErrorBoundary";

// Clickjacking guard for hosts that send no X-Frame-Options header: FLEXS never runs inside another site's frame.
if (import.meta.env.PROD && window.self !== window.top) {
  document.documentElement.style.display = "none";
  try { window.top!.location.href = window.self.location.href; } catch { /* a foreign frame may refuse; the page stays hidden */ }
  throw new Error("FLEXS does not run inside a frame");
}

enforceSessionChoice();
watchErrors();

// The French dictionary is loaded before the first paint, so the page never flashes in English.
void initLanguage().catch(() => undefined).then(() => createRoot(document.getElementById("root")!).render(<ErrorBoundary><App /></ErrorBoundary>));
