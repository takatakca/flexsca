/**
 * SEO + consent kit: the ONE settings file per site.
 *
 * Rules:
 * - Only facts already present in this repo. Never invent an address, hours, phone, rating or review.
 * - Unknown values stay `undefined` with a `TODO(owner)` comment; the JSON-LD builder skips them.
 * - `url` is the real production domain (see foodhubca/private/hosting/MOCHAHOST_DOMAINS.md), never *.lovable.app.
 */

export type SchemaType =
  | "Organization"
  | "LocalBusiness"
  | "Restaurant"
  | "NGO"
  | "SportsOrganization"
  | "Event";

export type PostalAddress = {
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string | undefined;
  addressCountry: string;
};

export type SiteConfig = {
  /** Public business name. */
  name: string;
  /** Legal name if different (TODO(owner) when unknown). */
  legalName?: string | undefined;
  /** Real production origin, no trailing slash. */
  url: string;
  /** <html lang>. French first (Québec). */
  lang: "fr-CA";
  /** Open Graph locale. */
  locale: "fr_CA";
  defaultTitle: string;
  defaultDescription: string;
  /** Default share image: path under /public or absolute URL. undefined = no og:image. */
  ogImage?: string | undefined;
  /** Logo: path under /public or absolute URL. */
  logo?: string | undefined;
  schemaType: SchemaType;
  email?: string | undefined;
  /** E.164, e.g. "+15145550000". */
  phone?: string | undefined;
  address?: PostalAddress | undefined;
  /** Real social profile URLs only (no "#", no generic facebook.com). */
  sameAs: string[];
  /** Privacy policy route, used by the cookie banner. undefined = no page yet (TODO(owner)). */
  privacyPath?: string | undefined;
  /** Law 25 privacy officer. */
  privacyOfficer: { name?: string | undefined; email?: string | undefined };
};

export const SITE: SiteConfig = {
  name: "FLEX'S",
  // TODO(owner): legal name of the company ("FLEX'S Global Limited" on /cookies looks copied, not confirmed).
  legalName: undefined,
  url: "https://flexs.ca",
  lang: "fr-CA",
  locale: "fr_CA",
  // Existing home page H1 + intro text (English for now). TODO(owner): French version.
  defaultTitle: "FLEX'S — Find trusted professionals near you",
  defaultDescription:
    "Need help finding a professional? Tell us about your project and we'll connect you with trusted professionals. Best of all – it's completely free!",
  // TODO(owner): add a real share image (1200x630) in public/ and set it here (Lovable image removed).
  ogImage: undefined,
  // TODO(owner): add a logo file in public/ and set it here.
  logo: undefined,
  schemaType: "Organization",
  // Address already used in the app (src/pages/customer/BuyerDashboard.tsx). TODO(owner): confirm the mailbox exists.
  email: "team@flexs.ca",
  // TODO(owner): real phone number (the Help Center's 1-555-123-4567 was a placeholder and is hidden).
  phone: undefined,
  // TODO(owner): business address, if it should be public.
  address: undefined,
  // TODO(owner): real social profile URLs (footer icons are placeholders).
  sameAs: [],
  // TODO(owner): no privacy policy page yet; set e.g. "/privacy" once it exists.
  privacyPath: undefined,
  // TODO(owner): name + email of the person responsible for personal information (Law 25).
  privacyOfficer: { name: undefined, email: undefined },
};
