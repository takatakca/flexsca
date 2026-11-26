import { describe, expect, it } from "vitest";
import { matchCities, parseLocation } from "@/lib/location";

describe("request location", () => {
  it("never stores a postal code as the town", () => {
    expect(parseLocation("h4g2r3")).toEqual({ city: "Montréal", postalCode: "H4G 2R3", text: "Montréal, H4G 2R3" });
    expect(parseLocation("H7N-1A1")).toEqual({ city: "Laval", postalCode: "H7N 1A1", text: "Laval, H7N 1A1" });
    expect(parseLocation("J0K 1A0")).toEqual({ city: null, postalCode: "J0K 1A0", text: "J0K 1A0" });
  });
  it("keeps the town the customer typed", () => {
    expect(parseLocation("Sherbrooke")).toEqual({ city: "Sherbrooke", postalCode: null, text: "Sherbrooke" });
    expect(parseLocation("Laval, H7N 1A1").city).toBe("Laval");
    expect(parseLocation("Saint-Jean-sur-Richelieu  j3b 1a1")).toEqual({ city: "Saint-Jean-sur-Richelieu", postalCode: "J3B 1A1", text: "Saint-Jean-sur-Richelieu, J3B 1A1" });
    expect(parseLocation("Québec").city).toBe("Québec");
    expect(parseLocation("Toronto, M1A1A1").postalCode).toBe("M1A 1A1");
  });
  it("suggests towns without caring about accents or hyphens", () => {
    const towns = ["Montréal", "Mont-Royal", "Mont-Tremblant", "Laval", "Trois-Rivières", "Saint-Jérôme"];
    expect(matchCities(towns, "mont")).toEqual(["Montréal", "Mont-Royal", "Mont-Tremblant"]);
    expect(matchCities(towns, "riv")).toEqual(["Trois-Rivières"]);
    expect(matchCities(towns, "st jerome")).toEqual([]);
    expect(matchCities(towns, "jerome")).toEqual(["Saint-Jérôme"]);
    expect(matchCities(towns, "Laval")).toEqual([]);
    expect(matchCities(towns, "h4g")).toEqual([]);
  });
});
