import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/lib/error-report";

/**
 * Last line of defence: if a screen fails to draw, the visitor sees a way out instead of a blank page,
 * and the failure is recorded for the owner.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { reportError(error, `screen${info.componentStack ? info.componentStack.split("\n").slice(1, 2).join("").trim().slice(0, 60) : ""}`); }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main role="alert" className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-gutter text-center">
        <p className="text-[26px] font-bold tracking-tight text-fx-ink">FLEXS</p>
        <h1 className="mt-8 text-2xl text-fx-ink">Something went wrong on this page</h1>
        <p className="mt-3 text-fx-secondary">The problem has been reported to our team. Reload the page, or go back to the home page.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="h-11 rounded-fx-xs bg-primary px-6 text-primary-foreground shadow-fx-button">Reload the page</button>
          <a href="/" className="inline-flex h-11 items-center rounded-fx-xs border border-fx-line px-6 text-fx-ink">Home page</a>
        </div>
      </main>
    );
  }
}
