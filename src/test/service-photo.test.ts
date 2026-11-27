import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { servicePhoto } from "@/lib/service-photo";

const stored = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800";

describe("service photos", () => {
  it("serves the local copy, full or small", () => {
    expect(servicePhoto(stored)).toBe("/images/services/photo-1416879595882-3373a0480b5b.webp");
    expect(servicePhoto(stored, "small")).toBe("/images/services/photo-1416879595882-3373a0480b5b-sm.webp");
  });

  it("has both files on disk for a local photo", () => {
    expect(existsSync(`public${servicePhoto(stored)}`)).toBe(true);
    expect(existsSync(`public${servicePhoto(stored, "small")}`)).toBe(true);
  });

  it("leaves an unknown address and an empty value alone", () => {
    expect(servicePhoto("https://example.com/a.jpg", "small")).toBe("https://example.com/a.jpg");
    expect(servicePhoto(null)).toBeUndefined();
  });
});
