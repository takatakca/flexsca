import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn(() => Promise.resolve({ data: null, error: null })) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));

import ErrorBoundary from "@/components/ErrorBoundary";
import { reportError } from "@/lib/error-report";

function Broken(): never { throw new Error("screen exploded"); }

describe("crash recovery", () => {
  beforeEach(() => rpc.mockClear());

  it("shows a way out instead of a blank page and records the failure", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<ErrorBoundary><Broken /></ErrorBoundary>);
    quiet.mockRestore();
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Something went wrong on this page" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reload the page" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Home page" }).getAttribute("href")).toBe("/");
    expect(rpc).toHaveBeenCalledTimes(1);
    const [name, payload] = rpc.mock.calls[0] as unknown as [string, Record<string, string>];
    expect(name).toBe("report_client_error");
    expect(payload.p_message).toContain("screen exploded");
    expect(payload.p_path).not.toContain("?");
  });

  it("renders the page normally when nothing fails", () => {
    render(<ErrorBoundary><p>fine</p></ErrorBoundary>);
    expect(screen.getByText("fine")).toBeTruthy();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("ignores noise, repeats and floods", () => {
    reportError(new Error("Failed to fetch"));
    reportError("ResizeObserver loop limit exceeded");
    expect(rpc).not.toHaveBeenCalled();
    reportError(new Error("same problem")); reportError(new Error("same problem"));
    expect(rpc).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 20; i++) reportError(new Error(`problem ${i}`));
    expect(rpc.mock.calls.length).toBeLessThanOrEqual(5);
  });
});
