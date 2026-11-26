import { useEffect } from "react";
import { getLanguage, translate } from "@/lib/i18n";

const SITE = "https://flexs.ca";

function setMeta(selector: string, create: () => HTMLElement, attribute: string, value: string) {
  let element = document.head.querySelector<HTMLElement>(selector);
  if (!element) { element = create(); document.head.appendChild(element); }
  element.setAttribute(attribute, value);
}

/**
 * Page description, canonical address and optional structured data for search engines.
 * `data` is schema.org JSON-LD; it is removed again when the page is left.
 */
export function useSeo({ description, path, data }: { description?: string; path?: string; data?: Record<string, unknown> | null }) {
  const json = data ? JSON.stringify(data) : "";
  useEffect(() => {
    if (description) {
      // In French the description is translated like the rest of the page.
      const text = translate(description.replace(/\s+/g, " ").trim()).slice(0, 300);
      setMeta('meta[name="description"]', () => Object.assign(document.createElement("meta"), { name: "description" }), "content", text);
      setMeta('meta[property="og:description"]', () => { const m = document.createElement("meta"); m.setAttribute("property", "og:description"); return m; }, "content", text);
    }
    if (path) {
      // Each page exists in two languages: the plain address (English) and the same address with ?lang=fr.
      const french = `${SITE}${path}${path.includes("?") ? "&" : "?"}lang=fr`;
      const url = getLanguage() === "fr" ? french : SITE + path;
      setMeta('link[rel="canonical"]', () => Object.assign(document.createElement("link"), { rel: "canonical" }), "href", url);
      for (const [code, href] of [["en-CA", SITE + path], ["fr-CA", french], ["x-default", SITE + path]]) {
        setMeta(`link[rel="alternate"][hreflang="${code}"]`, () => Object.assign(document.createElement("link"), { rel: "alternate", hreflang: code }), "href", href);
      }
      setMeta('meta[property="og:url"]', () => { const m = document.createElement("meta"); m.setAttribute("property", "og:url"); return m; }, "content", url);
    }
    if (!json) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    // "<" is escaped so that text from the database can never close the script element.
    script.textContent = json.replace(/</g, "\\u003c");
    document.head.appendChild(script);
    return () => script.remove();
  }, [description, path, json]);
}
