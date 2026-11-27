import { beforeAll, describe, expect, it } from "vitest";
import dictionary from "@/i18n/fr.json";
import { getLanguage, initLanguage, translate } from "@/lib/i18n";

describe("French version", () => {
  it("has a valid dictionary: no empty entry, every rule compiles", () => {
    const strings = dictionary.strings as Record<string, string>;
    expect(Object.keys(strings).length).toBeGreaterThan(1500);
    for (const [english, french] of Object.entries(strings)) {
      expect(french.trim().length, english).toBeGreaterThan(0);
      // A translation keeps the numbers of its source, so prices, limits and delays cannot drift.
      if (english.length < 60 && !/GSM|Happy hour/.test(english)) expect((french.match(/\d+/g) ?? []).join(","), english).toBe((english.match(/\d+/g) ?? []).join(","));
    }
    for (const [source] of dictionary.patterns as [string, string][]) expect(() => new RegExp(source, "u")).not.toThrow();
  });
  it("keeps brand names", () => {
    for (const french of Object.values(dictionary.strings as Record<string, string>)) expect(french).not.toMatch(/\bFlexs\b|\bTakatak\b(?!\.)/);
  });
  it("defaults to English unless the browser or the visitor asks for French", () => {
    window.localStorage.clear();
    expect(getLanguage()).toBe("en");
    window.localStorage.setItem("flexs.lang", "fr");
    expect(getLanguage()).toBe("fr");
  });
  describe("when French is chosen", () => {
    beforeAll(async () => { window.localStorage.setItem("flexs.lang", "fr"); await initLanguage(); });
    it("translates known text and leaves names, towns and numbers alone", () => {
      expect(translate("Search")).toBe("Rechercher");
      expect(translate("  Search ")).toBe("  Rechercher ");
      expect(translate("Plomberie Tremblay inc.")).toBe("Plomberie Tremblay inc.");
      expect(translate("Montréal")).toBe("Montréal");
      expect(translate("514 555 0100")).toBe("514 555 0100");
    });
    it("applies the rules for numbers and service names", () => {
      expect(translate("47 minutes ago")).toBe("il y a 47 min");
      expect(translate("Step 4 of 9")).toBe("Étape 4 sur 9");
      expect(translate("About 157,508 businesses")).toBe("Environ 157\u00a0508 entreprises");
      expect(translate("8,482")).toBe("8\u00a0482");
      expect(translate("Page 1 of 8,482")).toBe("Page 1 sur 8\u00a0482");
      expect(translate("Find Plumbing professionals near you")).toBe("Trouvez des professionnels en plomberie près de chez vous");
    });
    it("translates text added to the page afterwards, and attributes", async () => {
      const button = document.createElement("button");
      button.setAttribute("aria-label", "Open navigation");
      button.textContent = "Continue";
      const name = document.createElement("h2");
      name.setAttribute("translate", "no");
      name.textContent = "Search";
      document.body.append(button, name);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(button.textContent).toBe("Continuer");
      expect(button.getAttribute("aria-label")).toBe("Ouvrir la navigation");
      expect(name.textContent).toBe("Search");
      expect(document.documentElement.lang).toBe("fr-CA");
    });
  });
});
