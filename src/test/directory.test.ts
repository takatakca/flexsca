import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { cleanTerm } from "@/lib/directory";
import { customerReturnPath } from "@/lib/auth-navigation";

const migration = readFileSync("supabase/migrations/20261118120000_business_directory.sql", "utf8");
const importer = readFileSync("scripts/build_rbq_directory.py", "utf8");

describe("business directory", () => {
  it("strips filter and pattern characters from search terms", () => {
    expect(cleanTerm("  plomb%erie_(mc),*  ")).toBe("plomb erie mc");
    expect(cleanTerm("a".repeat(200))).toHaveLength(60);
  });

  it("only returns to a claim page with a well-formed slug", () => {
    expect(customerReturnPath("/business/plomberie-mc-montreal-123/claim")).toBe("/business/plomberie-mc-montreal-123/claim");
    expect(customerReturnPath("/business/../app/admin/claim")).toBeNull();
    expect(customerReturnPath("//evil.example/business/abc/claim")).toBeNull();
  });

  it("keeps no contact column on listings and no client access to ownership proofs", () => {
    const table = migration.slice(migration.indexOf("CREATE TABLE IF NOT EXISTS public.business_listings"), migration.indexOf("CREATE INDEX"));
    expect(table).not.toMatch(/email|phone|address|postal/i);
    expect(migration).toMatch(/REVOKE ALL ON public\.business_listing_verifiers FROM anon, authenticated/);
    expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.directory_grant_listing\(uuid, text, uuid\) FROM PUBLIC, anon, authenticated/);
  });

  it("never writes Montréal addresses or coordinates into a listing", () => {
    const mtl = readFileSync("scripts/build_montreal_directory.py", "utf8");
    const written = mtl.slice(mtl.indexOf("rows.append"), mtl.indexOf("size = 2500"));
    expect(written).not.toMatch(/'address'|'ADRESSE'|latitude|LAT|LONG|'CIVIQUE'\]\s*,\s*'/);
    expect(mtl).toMatch(/INSERT INTO public\.business_listings \(source, source_ref, name, city, region, trade, activity, slug\)/);
  });

  it("keeps tourism and permit contact fields out of the province-wide import", () => {
    const qc = readFileSync("scripts/build_quebec_open_directory.py", "utf8");
    expect(qc).not.toMatch(/TelephonePrincipal|SiteInternet|CodePostal|NumeroVoie|ETABLISSEMENT_RUE|ETABLISSEMENT_CODE_POSTAL|Latitude/);
    expect(qc).toMatch(/email_hash\(r\.get\('Courriel'\)\)/);
  });

  it("writes the source email only as a hash and never the phone or address", () => {
    expect(importer).toMatch(/hashlib\.sha256\(email\.encode\(\)\)/);
    expect(importer).not.toMatch(/r\['(Numéro de téléphone|Adresse)'\]/);
  });
});

describe("payment hardening", () => {
  const sql = readFileSync("supabase/migrations/20261118130000_payment_and_upload_hardening.sql", "utf8");
  const webhook = readFileSync("supabase/functions/stripe-webhook/index.ts", "utf8");
  const checkout = readFileSync("supabase/functions/create-checkout-session/index.ts", "utf8");
  it("reverses credits on refund and dispute, service role only", () => {
    expect(webhook).toMatch(/charge\.refunded/); expect(webhook).toMatch(/charge\.dispute\.created/);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.reverse_credit_purchase\(text, text\) FROM PUBLIC, anon, authenticated/);
  });
  it("checks purchase limits before creating a Stripe session", () => {
    expect(checkout.indexOf("checkout_allowed")).toBeGreaterThan(0);
    expect(checkout.indexOf("checkout_allowed")).toBeLessThan(checkout.indexOf("stripe.checkout.sessions.create"));
  });
  it("limits the public media bucket to images of 5 MB", () => {
    expect(sql).toMatch(/file_size_limit = 5242880, allowed_mime_types = ARRAY\['image\/jpeg','image\/png','image\/webp'\]/);
  });
});
