import { createClient } from "npm:@supabase/supabase-js@2.95.3";
import { parseTakatakOpportunity } from "../_shared/takatak-opportunity.ts";

const encoder = new TextEncoder();
const MAX_BODY_BYTES = 18_000;
const MAX_AGE_MS = 5 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

function hexToBytes(value: string): Uint8Array | null {
  if (!/^[a-f0-9]{64}$/i.test(value)) return null;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < value.length; i += 2) {
    bytes[i / 2] = Number.parseInt(value.slice(i, i + 2), 16);
  }
  return bytes;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function verify(
  req: Request,
  rawBody: string,
  integrationId: string,
  secret: string,
): Promise<{ ok: true; eventId: string } | { ok: false }> {
  const suppliedIntegration = req.headers.get("x-integration-id")?.trim();
  const eventId = req.headers.get("x-event-id")?.trim() ?? "";
  const timestamp = req.headers.get("x-timestamp")?.trim() ?? "";
  const signature = (
    req.headers.get("x-signature")?.trim().replace(/^sha256=/i, "") ?? ""
  );
  const signatureBytes = hexToBytes(signature);

  if (
    suppliedIntegration !== integrationId ||
    !eventId ||
    eventId.length > 160 ||
    !/^\d{10}$/.test(timestamp) ||
    !signatureBytes
  ) {
    return { ok: false };
  }

  const timestampMs = Number(timestamp) * 1000;
  if (
    !Number.isFinite(timestampMs) ||
    Math.abs(Date.now() - timestampMs) > MAX_AGE_MS
  ) {
    return { ok: false };
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(`${timestamp}.${eventId}.${rawBody}`),
  );

  return valid ? { ok: true, eventId } : { ok: false };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ accepted: false, error: "method_not_allowed" }, 405);
  }

  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    return json({ accepted: false, error: "unsupported_media_type" }, 415);
  }

  const integrationId =
    Deno.env.get("TAKATAK_FLEXS_INTEGRATION_ID")?.trim() ?? "";
  const secret =
    Deno.env.get("TAKATAK_FLEXS_OPPORTUNITY_SECRET")?.trim() ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";

  if (!integrationId || secret.length < 32 || !supabaseUrl || !serviceRole) {
    return json({ accepted: false, error: "not_configured" }, 503);
  }

  const rawBody = await req.text();
  if (encoder.encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return json({ accepted: false, error: "payload_too_large" }, 413);
  }

  const auth = await verify(req, rawBody, integrationId, secret);
  if (!auth.ok) {
    return json({ accepted: false, error: "unauthorized" }, 401);
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(rawBody);
  } catch {
    return json({ accepted: false, error: "invalid_json" }, 400);
  }

  const opportunity = parseTakatakOpportunity(decoded);
  if (!opportunity || auth.eventId !== opportunity.opportunityId) {
    return json({ accepted: false, error: "invalid_opportunity" }, 400);
  }

  const payloadHash = await sha256(rawBody);
  const db = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: existingError } = await db
    .from("leads")
    .select("id, external_payload_hash")
    .eq("source_application", "takatak")
    .eq("external_lead_id", opportunity.opportunityId)
    .maybeSingle();

  if (existingError) {
    console.error("takatak opportunity lookup failed", existingError.code);
    return json({ accepted: false, error: "storage_unavailable" }, 503);
  }

  if (existing) {
    if (existing.external_payload_hash !== payloadHash) {
      return json({ accepted: false, error: "event_conflict" }, 409);
    }
    return json({
      accepted: true,
      opportunityId: opportunity.opportunityId,
      flexsLeadId: existing.id,
      duplicate: true,
    });
  }

  const { data: category, error: categoryError } = await db
    .from("service_categories")
    .select("name, slug, base_credit_cost")
    .eq("slug", opportunity.categorySlug)
    .eq("is_active", true)
    .maybeSingle();

  if (categoryError) {
    console.error("takatak opportunity category failed", categoryError.code);
    return json({ accepted: false, error: "storage_unavailable" }, 503);
  }

  if (!category) {
    return json({ accepted: false, error: "unsupported_category" }, 422);
  }

  const locationText = [
    opportunity.location.city,
    opportunity.location.province,
    opportunity.location.postalCode,
  ].filter(Boolean).join(", ");

  const { data: lead, error: insertError } = await db
    .from("leads")
    .insert({
      category: category.name,
      location_text: locationText,
      city: opportunity.location.city,
      province: opportunity.location.province,
      postal_code: opportunity.location.postalCode,
      service_subtype: opportunity.serviceSubtype,
      customer_name: opportunity.customer.name,
      customer_email: opportunity.customer.email,
      customer_phone: opportunity.customer.phone,
      details: opportunity.details,
      answers: {},
      is_urgent: opportunity.isUrgent,
      credits_cost: category.base_credit_cost,
      status: "new",
      assigned_to: null,
      source_application: "takatak",
      source_product: opportunity.sourceProduct,
      external_lead_id: opportunity.opportunityId,
      external_reference: opportunity.reference,
      external_payload_hash: payloadHash,
      contact_disclosure_authorized: true,
      external_authorization_basis: opportunity.authorizationBasis,
    })
    .select("id")
    .single();

  if (insertError || !lead) {
    if (insertError?.code === "23505") {
      const { data: raced } = await db
        .from("leads")
        .select("id, external_payload_hash")
        .eq("source_application", "takatak")
        .eq("external_lead_id", opportunity.opportunityId)
        .maybeSingle();

      if (raced?.external_payload_hash === payloadHash) {
        return json({
          accepted: true,
          opportunityId: opportunity.opportunityId,
          flexsLeadId: raced.id,
          duplicate: true,
        });
      }
      return json({ accepted: false, error: "event_conflict" }, 409);
    }

    console.error(
      "takatak opportunity insert failed",
      insertError?.code ?? "unknown",
    );
    return json({ accepted: false, error: "storage_unavailable" }, 503);
  }

  await db.from("lead_messages").insert({
    lead_id: lead.id,
    sender_type: "system",
    message: "New service opportunity distributed through TAKATAK.",
  });

  return json({
    accepted: true,
    opportunityId: opportunity.opportunityId,
    flexsLeadId: lead.id,
    duplicate: false,
  });
});
