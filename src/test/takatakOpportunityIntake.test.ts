import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { parseTakatakOpportunity } from "../../supabase/functions/_shared/takatak-opportunity";

const fixture = () => ({
  version: 1,
  opportunityId: "r2f-master-lead-0001",
  reference: "ABC12345",
  sourceProduct: "r2f",
  categorySlug: "plumbing",
  serviceSubtype: "water-leak",
  location: {
    city: "Montréal",
    province: "QC",
    postalCode: "H1H 1H1",
  },
  customer: {
    name: "Marie Tremblay",
    email: "marie@example.test",
    phone: "514 555 0101",
  },
  details: "Water is leaking under the kitchen sink.",
  isUrgent: true,
  contactDisclosureAuthorized: true,
  authorizationBasis: "customer_requested_provider_matching",
});

describe("TAKATAK -> FLEXS opportunity contract", () => {
  it("accepts an authorized R2F opportunity with usable contact", () => {
    const parsed = parseTakatakOpportunity(fixture());
    expect(parsed).not.toBeNull();
    expect(parsed?.customer.email).toBe("marie@example.test");
    expect(parsed?.location.postalCode).toBe("H1H 1H1");
  });

  it("refuses distribution when contact disclosure is not authorized", () => {
    expect(
      parseTakatakOpportunity({
        ...fixture(),
        contactDisclosureAuthorized: false,
      }),
    ).toBeNull();
  });

  it("requires at least one professional contact method", () => {
    expect(
      parseTakatakOpportunity({
        ...fixture(),
        customer: {
          ...fixture().customer,
          email: null,
          phone: null,
        },
      }),
    ).toBeNull();
  });

  it("rejects malformed category, postal code and external reference", () => {
    expect(
      parseTakatakOpportunity({ ...fixture(), categorySlug: "Plumbing / unsafe" }),
    ).toBeNull();
    expect(
      parseTakatakOpportunity({
        ...fixture(),
        location: { ...fixture().location, postalCode: "invalid" },
      }),
    ).toBeNull();
    expect(
      parseTakatakOpportunity({ ...fixture(), reference: "short" }),
    ).toBeNull();
  });

  it("keeps the external function server-to-server and idempotent", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "supabase/functions/takatak-opportunity-intake/index.ts",
      ),
      "utf8",
    );

    expect(source).toContain('req.headers.get("x-integration-id")');
    expect(source).toContain('req.headers.get("x-signature")');
    expect(source).toContain("TAKATAK_FLEXS_OPPORTUNITY_SECRET");
    expect(source).toContain("external_payload_hash");
    expect(source).toContain("event_conflict");
    expect(source).not.toContain("Access-Control-Allow-Origin");
    expect(source).not.toMatch(/return json\([^)]*customer_/);
  });

  it("adds unique TAKATAK provenance without changing native lead ownership", () => {
    const migration = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/20261010090000_takatak_opportunity_provenance.sql",
      ),
      "utf8",
    );

    expect(migration).toContain("leads_external_source_id_uniq");
    expect(migration).toContain("contact_disclosure_authorized = true");
    expect(migration).not.toContain("DROP TABLE");
  });
});
