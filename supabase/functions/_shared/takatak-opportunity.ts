export type TakatakOpportunity = {
  version: 1;
  opportunityId: string;
  reference: string;
  sourceProduct: "r2f";
  categorySlug: string;
  serviceSubtype: string | null;
  location: {
    city: string;
    province: string;
    postalCode: string;
  };
  customer: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  details: string;
  isUrgent: boolean;
  contactDisclosureAuthorized: true;
  authorizationBasis: string;
};

const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[a-z]{2,24}$/i;
const PHONE_RE = /^[+()0-9 .-]{7,40}$/;
const POSTAL_RE = /^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/i;

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function requiredText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean && clean.length <= max ? clean : null;
}

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  return clean && clean.length <= max ? clean : undefined;
}

export function parseTakatakOpportunity(raw: unknown): TakatakOpportunity | null {
  const root = object(raw);
  if (!root || root.version !== 1) return null;

  const location = object(root.location);
  const customer = object(root.customer);
  if (!location || !customer) return null;

  const opportunityId = requiredText(root.opportunityId, 160);
  const reference = requiredText(root.reference, 50);
  const categorySlug = requiredText(root.categorySlug, 160);
  const serviceSubtype = optionalText(root.serviceSubtype, 160);
  const city = requiredText(location.city, 120);
  const province = requiredText(location.province, 30);
  const postalCode = requiredText(location.postalCode, 20);
  const customerName = requiredText(customer.name, 160);
  const emailRaw = optionalText(customer.email, 254);
  const phoneRaw = optionalText(customer.phone, 40);
  const details = requiredText(root.details, 4000);
  const authorizationBasis = requiredText(root.authorizationBasis, 240);

  if (
    !opportunityId ||
    !/^[A-Za-z0-9._:-]{8,160}$/.test(opportunityId) ||
    !reference ||
    !/^[A-Z0-9]{8,50}$/.test(reference) ||
    root.sourceProduct !== "r2f" ||
    !categorySlug ||
    !/^[a-z0-9-]{1,160}$/.test(categorySlug) ||
    serviceSubtype === undefined ||
    !city ||
    !province ||
    !postalCode ||
    !POSTAL_RE.test(postalCode) ||
    !customerName ||
    emailRaw === undefined ||
    phoneRaw === undefined ||
    !details ||
    root.contactDisclosureAuthorized !== true ||
    !authorizationBasis
  ) {
    return null;
  }

  const email = emailRaw?.toLowerCase() ?? null;
  const phone = phoneRaw ?? null;
  if (email && !EMAIL_RE.test(email)) return null;
  if (phone && !PHONE_RE.test(phone)) return null;
  if (!email && !phone) return null;

  if (typeof root.isUrgent !== "boolean") return null;

  return {
    version: 1,
    opportunityId,
    reference,
    sourceProduct: "r2f",
    categorySlug,
    serviceSubtype: serviceSubtype ?? null,
    location: {
      city,
      province,
      postalCode: postalCode.toUpperCase(),
    },
    customer: {
      name: customerName,
      email,
      phone,
    },
    details,
    isUrgent: root.isUrgent,
    contactDisclosureAuthorized: true,
    authorizationBasis,
  };
}
