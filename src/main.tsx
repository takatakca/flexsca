import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { enforceSessionChoice } from "./lib/session-choice";

enforceSessionChoice();

createRoot(document.getElementById("root")!).render(<App />);
