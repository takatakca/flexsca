import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// The directory tables are newer than the generated types; this client is typed by hand below.
const db = supabase as unknown as SupabaseClient;

export interface Listing {
  id: string; source: "rbq" | "mtl_food" | "mtl_shops" | "opc" | "sit"; source_ref: string; activity: string | null; name: string; other_name: string | null; city: string; region: string | null;
  trade: string; category_slug: string | null; slug: string; status: "listed" | "claimed"; claimed_at: string | null;
}
export const TRADES = ["Restaurant", "Bar", "Bakery and café", "Caterer", "Grocery and food shop", "Retail shop", "Beauty and personal care", "Health and wellness",
  "Fitness and leisure", "Arts and culture", "Hotel and venue", "Camping and outfitters", "Travel agency", "Farm and local products", "Transport", "Auto services", "Home and repair services", "Professional services", "Plumbing", "Electrical", "Heating and cooling",
  "General contractor", "Construction and renovation", "Other services"] as const;

/** Where a listing comes from. The credit line is a condition of each open-data licence. */
export const SOURCES: Record<Listing["source"], { credit: string; register: string }> = {
  rbq: { credit: 'Régie du bâtiment du Québec, "Liste des licences actives", CC BY 4.0', register: "the public RBQ licence register" },
  mtl_food: { credit: 'Ville de Montréal, "Établissements alimentaires", CC BY 4.0', register: "Montréal's public list of food establishments" },
  opc: { credit: 'Office de la protection du consommateur, "Liste des permis et des exemptions en vigueur", CC BY 4.0', register: "the consumer protection office's public list of permit holders" },
  sit: { credit: 'Ministère du Tourisme, "Système d\'information touristique Québec", CC BY 4.0', register: "the Quebec tourism ministry's public directory" },
  mtl_shops: { credit: 'Ville de Montréal, "Locaux commerciaux et statuts d\'occupation", CC BY 4.0', register: "Montréal's public survey of commercial spaces" },
};
export const PAGE_SIZE = 20;
const COLUMNS = "id,source,activity,source_ref,name,other_name,city,region,trade,category_slug,slug,status,claimed_at";

/** Characters that have a meaning in a PostgREST filter or a LIKE pattern are dropped from what people type. */
export const cleanTerm = (value: string) => value.replace(/[%_,()*\\"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);

export async function searchListings(params: { name: string; city: string; trade: string; page: number }) {
  let query = db.from("business_listings").select(COLUMNS, { count: "estimated" });
  const name = cleanTerm(params.name), city = cleanTerm(params.city);
  if (name.length >= 2) query = query.ilike("name", `%${name}%`);
  if (city.length >= 2) query = query.ilike("city", `${city}%`);
  if ((TRADES as readonly string[]).includes(params.trade)) query = query.eq("trade", params.trade);
  const from = Math.max(0, params.page) * PAGE_SIZE;
  const { data, error, count } = await query.order("name").range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error("The directory could not be loaded. Try again.");
  return { rows: (data ?? []) as Listing[], total: count ?? 0 };
}

export async function getListing(slug: string) {
  const { data, error } = await db.from("business_listings").select(COLUMNS).eq("slug", slug).maybeSingle();
  if (error) throw new Error("This business could not be loaded. Try again.");
  return data as Listing | null;
}

export async function getTrialTerms() {
  const { data } = await db.from("directory_settings").select("trial_days,trial_credits").maybeSingle();
  return (data ?? { trial_days: 30, trial_credits: 0 }) as { trial_days: number; trial_credits: number };
}

export async function claimListing(listingId: string, role: string, note: string) {
  const { data, error } = await db.rpc("claim_business_listing", { p_listing: listingId, p_role: role, p_note: note || null });
  if (error) throw new Error(error.message || "The claim could not be sent.");
  return data as { status: "approved" | "pending"; claim_id: string };
}

export interface PendingClaim { claim_id: string; created_at: string; listing_name: string; city: string; trade: string; licence: string; claimant_email: string; role: string; note: string | null }
export async function adminClaimQueue() {
  const { data, error } = await db.rpc("admin_claim_queue");
  if (error) throw new Error(error.message);
  return (data ?? []) as PendingClaim[];
}
export async function adminDecideClaim(claimId: string, approve: boolean) {
  const { error } = await db.rpc("admin_decide_claim", { p_claim: claimId, p_approve: approve, p_note: null });
  if (error) throw new Error(error.message);
}
