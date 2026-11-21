import { describe, expect, it } from "vitest";
import { matchServices } from "@/lib/service-search";

const services = [
  { name: "Plumbing", slug: "plumbing" }, { name: "House Cleaning", slug: "house-cleaning" }, { name: "Electrical Work", slug: "electrical-work" },
  { name: "Moving", slug: "removals" }, { name: "Landscaping and Yard Care", slug: "garden-maintenance" }, { name: "Painting", slug: "painting-decorating" },
];
const first = (typed: string) => matchServices(services, typed)[0]?.slug;

describe("service search", () => {
  it("finds a service from a partial English word", () => { expect(first("plumb")).toBe("plumbing"); expect(first("clean")).toBe("house-cleaning"); });
  it("finds a service from French words, with or without accents", () => {
    expect(first("plombier")).toBe("plumbing"); expect(first("ménage")).toBe("house-cleaning"); expect(first("menage")).toBe("house-cleaning");
    expect(first("électricien")).toBe("electrical-work"); expect(first("déménagement")).toBe("removals"); expect(first("gazon")).toBe("garden-maintenance"); expect(first("peintre")).toBe("painting-decorating");
  });
  it("finds a service from what the job is", () => { expect(first("leak")).toBe("plumbing"); expect(first("movers")).toBe("removals"); expect(first("lawn")).toBe("garden-maintenance"); });
  it("returns nothing for unrelated text and everything for no text", () => { expect(matchServices(services, "zzzz")).toHaveLength(0); expect(matchServices(services, " ")).toHaveLength(services.length); });
});
