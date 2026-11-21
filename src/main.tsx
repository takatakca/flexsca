import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { enforceSessionChoice } from "./lib/session-choice";
import { initLanguage } from "./lib/i18n";
import { watchErrors } from "./lib/error-report";
import ErrorBoundary from "./components/ErrorBoundary";

enforceSessionChoice();
watchErrors();

// The French dictionary is loaded before the first paint, so the page never flashes in English.
void initLanguage().catch(() => undefined).then(() => createRoot(document.getElementById("root")!).render(<ErrorBoundary><App /></ErrorBoundary>));
