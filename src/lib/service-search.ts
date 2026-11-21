/** Finds services from what people actually type, in English or French, with or without accents. */

/** Extra words per service address. The service name itself always matches. */
const KEYWORDS: Record<string, string> = {
  "plumbing": "plumber plombier plomberie tuyau drain robinet faucet leak fuite chauffe-eau water heater toilet toilette évier sink",
  "house-cleaning": "cleaner cleaning maid ménage menage entretien ménager nettoyage femme de ménage",
  "electrical-work": "electrician électricien electricien électricité electricite wiring câblage prise outlet panneau panel luminaire",
  "painting-decorating": "painter peintre peinture paint wallpaper papier peint",
  "garden-maintenance": "landscaping landscaper gardener garden paysagiste paysagement aménagement paysager pelouse gazon lawn tonte haie hedge jardin terrain yard",
  "removals": "moving mover movers déménagement demenagement déménageur demenageur",
  "dog-walking": "dog walker chien promenade promeneur",
  "personal-training": "trainer entraîneur entraineur gym fitness entraînement",
  "photography": "photographer photographe photo photos",
  "web-design": "website site web conception web designer",
  "legal-services": "lawyer avocat notaire notary juridique legal",
  "employment-lawyer": "avocat travail emploi congédiement labour",
  "tax-lawyer": "avocat fiscal fiscaliste impôt",
  "general-accounting": "accountant comptable comptabilité bookkeeping tenue de livres impôt tax",
  "financial-and-tax": "impôt taxes tax déclaration fiscalité comptable",
  "financial-planning": "planificateur financier planification financière",
  "wedding-catering": "caterer traiteur mariage noces",
  "commercial-catering": "caterer traiteur buffet",
  "private-chef-services": "chef cuisinier privé",
  "security-guard-services": "sécurité securite gardien agent de sécurité guard",
  "branding": "logo marque image de marque identité",
  "copywriting": "rédaction redaction rédacteur texte",
  "advertising-agency": "publicité publicite agence pub",
  "business": "entreprise affaires",
  "event-and-travel-services": "événement evenement voyage",
  "design-and-media": "design graphisme graphiste médias",
};

const fold = (value: string) => value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export interface Searchable { name: string; slug: string }

/** Services matching the typed text, best first: names that start with it, names that contain it, then keywords. */
export function matchServices<T extends Searchable>(services: T[], typed: string): T[] {
  const term = fold(typed);
  if (!term) return services;
  const scored: [number, T][] = [];
  for (const service of services) {
    const name = fold(service.name);
    const words = fold(`${service.slug} ${KEYWORDS[service.slug] ?? ""}`);
    const score = name === term ? 0 : name.startsWith(term) ? 1 : name.includes(term) ? 2
      : ` ${words} `.includes(` ${term}`) ? 3
      : term.length >= 4 && words.split(" ").some(word => word.length >= 4 && term.startsWith(word.slice(0, 5))) ? 4 : -1;
    if (score >= 0) scored.push([score, service]);
  }
  return scored.sort((a, b) => a[0] - b[0]).map(([, service]) => service);
}
