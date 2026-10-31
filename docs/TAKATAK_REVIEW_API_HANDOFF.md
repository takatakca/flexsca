# FLEXS → TAKATAK Review — business, lead and review API handoff

2026-10-31 — BEFORE / requested by owner — **REVEW**

The owner requested a signed note to FLEXS to provide its own APIs for businesses, leads and review-related information, integrated with QMAPS through the TAKATAK ecosystem. This request is for the FLEXS team; it does not claim those APIs already exist or are activated.

## Identity and existing implementation checked

The ecosystem inventory identifies **takatakca/flexsca** and **flexs.ca**. The owner's spelling “flex.ca” does not establish a different API host. Confirm the actual base URL with the FLEXS maintainer; never guess or send credentials to a similarly named domain.

Read current FLEXS `AGENTS.md`, work log, handoff, task queue and `FLEXS_ECOSYSTEM_INTEGRATION.md`. Existing code includes native verified customer reviews (`CustomerReview`, `ReviewsSection`, verified-review migration), provider service-area matching, private attachments, signed `takatak-opportunity-intake`, and opaque ADS attribution. Reuse these; do not build a second marketplace, lead identity directory, billing system or review UI.

V1 enhancement branch: https://github.com/takatakca/takatak-v1/tree/codex/review-ecosystem . The reputation cockpit retains V1's existing identity, workspace permission, AI queue/credits and paid-module boundaries.

## API deliverables requested from the FLEXS agent

1. Publish a non-secret, versioned API manifest: verified test/production origins, per-product authentication scheme, exact scopes, endpoint versions, pagination/cursor rules, rate limits, events, failure semantics and contract test results.
2. Provide **separate FLEXS-owned read scopes** for authorized businesses/providers, reviews and lead summaries. Agree dedicated credential names with TAKATAK; do not reuse QMAPS, ADS, opportunity-intake, 1LV or global Supabase credentials.
3. Implement/complete read APIs for the full authorized business/provider list and lead list, with deterministic opaque pagination and tenant/business authorization on every page. “All businesses and leads” means all records the caller is entitled to access in the linked workspace; it is not a cross-tenant/private-contact dump.
4. Provide a review export/event API over the existing verified customer-review system, with source ID, provider/business mapping, native rating semantics, text, allowed display name, timestamps/version, visibility/moderation, owner reply if actually supported, and explicit public-display rights. State clearly whether reply publication is supported.
5. Supply signed create/update/delete/visibility events through a durable outbox. Agree a dedicated V1 receiver and schema **before enabling any sender**. Existing ADS attribution is not a general lead/review synchronization endpoint.

## Proposed endpoint shapes — counterpart approval required

- Business/provider list: `{requestId,version,canonicalWorkspaceId,cursor?,limit}` → records, `hasMore`, opaque `nextCursor`, source version/watermark.
- Lead summary list: same scoped envelope, optionally filtered by an authorized source business. Return opaque lead ID, category, area at allowed precision, lifecycle state, source/canonical references, timestamps, and whether a separate contact-access action is permitted.
- Review list: scoped business ID plus cursor/limit → complete eligible review pages and source visibility/deletion versions.
- Owner reply: only if FLEXS implements it, enforce the canonical tenant/provider relationship, verified customer-review relationship, explicit reply scope and idempotency/version checks before publication.

Use the existing timestamp/event-ID/raw-body HMAC convention or a short-lived audience/scoped service credential agreed by both owners. No browser-held master key; no unbounded export; no third-party redirect carrying credentials.

## Lead/contact boundary

FLEXS already protects contact details behind its marketplace entitlement/unlock workflow. Preserve it. The summary API must not expose raw phone/email, private conversations, documents, precise private addresses, billing records or customer authentication IDs. An authorized contact-detail API needs a separate purpose, explicit disclosure authorization and existing unlock/member checks. Never infer consent from a shared email address, a review, or QMAPS business membership.

TAKATAK retains master identity, workspace mapping and the lead/opportunity routing decision. FLEXS retains its marketplace state and customer/provider authorization. Do not mark estimates as settled revenue, create a duplicate business membership, or distribute leads because AI suggests it.

## QMAPS linkage

Use **QMAPS → TAKATAK V1 → FLEXS** for permitted business matching/routing and **FLEXS → TAKATAK V1** for authorized state events. Canonical mapping records link source business/provider IDs. No direct QMAPS-to-FLEXS database coupling or credential sharing. Implement conflict/unlinked states explicitly and preserve source ownership.

## Acceptance evidence

Two-workspace tests; unauthorized pagination/cursor reuse; complete business/lead/review pages; raw-contact and attachment isolation; signed replay/conflict; deleted/hidden reviews; lead lifecycle ownership; provider-confirmed replies where supported; sender retry/dead-letter behavior. Keep code/CI evidence separate from live deployment and actual account connectivity.

DURING / handoff delivered as GitHub branch document: `revew/review-api-handoff`. No new billing, customer distribution, emails or production actions were performed. GitHub issue comments are blocked by this session's API network policy. Matching Drive copy is **NOT UPLOADED**: no Google Drive tool is callable.

— **REVEW**, review/reputation specialist
