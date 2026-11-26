/** Understands what a customer types as a location: a Canadian postal code, a town, or both. */

const POSTAL = /\b([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z])[ -]?(\d[ABCEGHJ-NPRSTV-Z]\d)\b/i;

/** First three characters of a postal code → town, for the areas where that is certain. */
function townFromPostal(fsa: string): string | null {
  if (fsa.startsWith("H7")) return "Laval";
  if (fsa.startsWith("H")) return "Montréal";
  if (fsa.startsWith("G1") || fsa.startsWith("G2")) return "Québec";
  if (fsa.startsWith("J4")) return "Longueuil";
  if (fsa.startsWith("J8") || fsa.startsWith("J9")) return fsa.startsWith("J8") ? "Gatineau" : null;
  if (fsa.startsWith("J1")) return "Sherbrooke";
  if (fsa.startsWith("G8") || fsa.startsWith("G9")) return "Trois-Rivières";
  if (fsa.startsWith("G7")) return "Saguenay";
  return null;
}

export interface ParsedLocation { city: string | null; postalCode: string | null; text: string }

/**
 * "h4g2r3" → Montréal, H4G 2R3. "Laval, H7N 1A1" → Laval, H7N 1A1. "Sherbrooke" → Sherbrooke.
 * A postal code is never stored as the town.
 */
export function parseLocation(input: string): ParsedLocation {
  const raw = input.replace(/\s+/g, " ").trim();
  const match = POSTAL.exec(raw);
  const postalCode = match ? `${match[1]} ${match[2]}`.toUpperCase() : null;
  const rest = (match ? raw.replace(match[0], " ") : raw).replace(/[,;]+/g, " ").replace(/\s+/g, " ").replace(/\b(qc|québec|quebec|canada)\s*$/i, m => (/^(québec|quebec)$/i.test(m.trim()) && !/\S\s+\S/.test(raw.replace(match?.[0] ?? "", "").trim()) ? m : "")).trim();
  const typedCity = rest && /\p{L}{2}/u.test(rest) && !/^\d+$/.test(rest) ? rest.slice(0, 100) : null;
  const city = typedCity ?? (postalCode ? townFromPostal(postalCode.slice(0, 3)) : null);
  const text = [city, postalCode].filter(Boolean).join(", ") || raw;
  return { city, postalCode, text: text.slice(0, 200) };
}

let cities: Promise<string[]> | null = null;
/** Quebec towns that have businesses in the directory, for suggestions while typing. */
export function loadCities(): Promise<string[]> {
  cities ??= fetch("/data/qc-cities.json").then(response => (response.ok ? response.json() : []), () => []);
  return cities;
}

const fold = (value: string) => value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
/** Towns starting with what was typed, then towns containing it; accents and hyphens do not matter. */
export function matchCities(all: string[], typed: string, limit = 6): string[] {
  const term = fold(typed);
  if (term.length < 2 || POSTAL.test(typed) || /^[a-z]\d/i.test(typed.trim())) return [];
  const starts: string[] = [], contains: string[] = [];
  for (const name of all) {
    const folded = fold(name);
    if (folded === term) return [];
    if (folded.startsWith(term)) starts.push(name); else if (folded.includes(` ${term}`)) contains.push(name);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
