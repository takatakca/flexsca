import { describe, expect, it } from "vitest";
import { closeOpenLayer, inAppPathFromUrl, isNativeApp, publicOrigin } from "@/lib/platform";

describe("platform helpers", () => {
  it("uses the browser origin on the web", () => {
    expect(isNativeApp()).toBe(false);
    expect(publicOrigin()).toBe(window.location.origin);
  });

  it("maps flexs.ca links to in-app routes, keeping query and auth fragment", () => {
    expect(inAppPathFromUrl("https://flexs.ca/auth/callback?next=%2Fmy-requests#access_token=x")).toBe("/auth/callback?next=%2Fmy-requests#access_token=x");
    expect(inAppPathFromUrl("https://www.flexs.ca/app/leads")).toBe("/app/leads");
  });

  it("rejects other hosts, schemes and malformed links", () => {
    expect(inAppPathFromUrl("https://flexs.ca.evil.example/app/leads")).toBeNull();
    expect(inAppPathFromUrl("http://flexs.ca/app/leads")).toBeNull();
    expect(inAppPathFromUrl("flexs://app/leads")).toBeNull();
    expect(inAppPathFromUrl("not a url")).toBeNull();
  });

  it("back button closes an open dialog with Escape and reports nothing open otherwise", () => {
    expect(closeOpenLayer()).toBe(false);
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    document.body.appendChild(dialog);
    const keys: string[] = [];
    const listen = (event: KeyboardEvent) => keys.push(event.key);
    document.addEventListener("keydown", listen);
    expect(closeOpenLayer()).toBe(true);
    document.removeEventListener("keydown", listen);
    dialog.remove();
    expect(keys).toEqual(["Escape"]);
  });
});
