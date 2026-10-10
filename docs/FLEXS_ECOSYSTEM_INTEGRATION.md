# FLEXS and TAKATAK-V1 integration evidence

FLEXS remains an independent product. The requested experience combines the FLEX Figma workflows and copy, a refreshed visual style using the site's colours, AI assistance, TAKATAK Auth, and merchant analytics in private TAKATAK dashboards.

## Design source

The FLEX Figma file has not been inspected: this session exposes no Figma connector and no file URL has been supplied. Existing interface improvements are provisional. They do not establish that the Figma questions, branching, text, validation, or screens have been reproduced. Once accessible, inventory each frame and prototype branch against the existing intake, customer, professional, and administration routes before changing their behaviour. Record missing states, mobile layouts, accessibility, and copy as explicit implementation gaps.

## Auth contracts actually inspected

Reference: TAKATAK-V1 commit `8adfa23ca50f52f6a49e0eaec68e933c68dd1c78`.

| Source | Observed contract | Consequence for FLEXS |
| --- | --- | --- |
| `src/lib/integrations/master-api/auth.ts` | Master API credential is `TAKATAK_1LV_API_KEY`; source explicitly forbids treating a child-app credential as a global master key | Never reuse this credential for FLEXS |
| `src/lib/integrations/master-api/identity.ts` | Child source is restricted to `1lv`; unverified contact details do not establish a shared verified identity | A dedicated FLEXS registration and verified identity binding are required |
| `src/app/api/v1/auth/otp/verify/route.ts` | Successful phone verification returns an identity, not a FLEXS access or refresh token | This response cannot authenticate the existing FLEXS Supabase session |
| `supabase/functions/identity-context/index.ts` | Verifies a JWT against TAKATAK's own Supabase project and resolves its identity context | It is not an implemented cross-project session exchange |

FLEXS currently uses its own Supabase Auth. Shared sign-in is not implemented or advertised as connected. The counterpart must first provide an explicitly authorized FLEXS contract: issuer, audience, redirect allowlist, state/nonce validation, expiring single-use exchange, immutable subject binding, session lifetime/revocation, and merchant membership authorization. Never link accounts solely from an unverified email or phone number. Keep service credentials on the server and preserve FLEXS row-level isolation.

## Confirmed event delivery versus future analytics

The implemented server integration sends opaque, verified lead attribution to `POST /api/integrations/ads/flexs/events` using its dedicated ADS credential. Durable retries and stable event identifiers support deduplication. This contract is not shared authentication, document sync, or a merchant dashboard analytics API. Deployment and a genuine accepted event are still required before claiming live connectivity.

For private merchant analytics, agree an immutable merchant-to-FLEXS-provider binding with TAKATAK before enabling exports. Authorize every request against that binding and membership; browser-supplied merchant identifiers cannot grant access. Define time windows, currency, timezone, metric definitions, and retention. Existing quote estimates are not settled revenue. Export minimum necessary aggregates; contact details, private conversations, and documents must not become attribution payloads.

## AI and document integration

AI is requested but no live AI provider has been configured or validated. Before enabling assistance, define the actual provider, server credential, permitted data, usage limits, audit trail, and user-visible failure behaviour. Suggested replies and request summaries must remain drafts requiring user action. The model must not grant account access, spend credits, accept quotes, or certify a merchant from generated text. Private tenant data requires the same authorization as ordinary application queries.

Document integration likewise requires a real counterpart contract and private storage: authorized upload/download, type and size validation, malware handling, retention/deletion, and auditable tenant access. No document connector or synchronization is currently claimed.


## TAKATAK opportunity projection for R2F

Status: **CODE COMPLETE on stacked feature branch; not deployed or production verified**.

This work is stacked on the existing FLEXS marketplace release PR and does not replace its marketplace, credits, RLS, response, or attribution work.

TAKATAK may project an eligible R2F lead into FLEXS through the Edge Function:

`takatak-opportunity-intake`

R2F never writes directly to FLEXS and FLEXS never reads the TAKATAK database.

### Authorization boundary

The request is server-to-server only and uses a dedicated HMAC credential:

- `TAKATAK_FLEXS_INTEGRATION_ID`
- `TAKATAK_FLEXS_OPPORTUNITY_SECRET`

Canonical signature input:

```text
<timestamp>.<opportunityId>.<rawBody>
```

Required headers:

```text
X-Integration-Id
X-Event-Id
X-Timestamp
X-Signature: sha256=<hex>
```

Timestamp tolerance is five minutes.

### Distribution consent gate

A projected lead is rejected unless:

```json
{
  "contactDisclosureAuthorized": true,
  "authorizationBasis": "customer_requested_provider_matching"
}
```

This prevents a professional from spending FLEXS credits on a TAKATAK opportunity whose contact information is not authorized for provider matching.

TAKATAK must decide eligibility before calling FLEXS. FLEXS does not infer consent from an email address, phone number, R2F account, or shared TAKATAK identity.

### Provenance and idempotency

External FLEXS leads record:

- `source_application = 'takatak'`
- `source_product = 'r2f'`
- TAKATAK master lead/opportunity id
- public TAKATAK reference
- SHA-256 payload hash
- contact-disclosure authorization basis

A partial unique index enforces one FLEXS lead per TAKATAK external lead ID.

Same external ID + same body returns the existing FLEXS lead as a duplicate.
Same external ID + different payload returns conflict and does not overwrite the existing opportunity.

Native FLEXS leads remain unchanged.

### Category and pricing

The incoming contract uses a FLEXS `service_categories.slug`.

The Edge Function resolves the active category on the FLEXS server and uses its configured name and base credit cost. TAKATAK cannot set an arbitrary FLEXS credit price in the request.

### Data handling

Only opportunities already authorized for provider matching may include the contact fields needed by the existing FLEXS unlock/contact workflow.

The adapter does not create a TAKATAK identity, FLEXS user, or business membership from those contact fields.

### Production gates

Before enabling this integration:

1. merge and deploy the prerequisite FLEXS marketplace release;
2. apply the provenance migration;
3. deploy `takatak-opportunity-intake`;
4. set the dedicated server secret through the approved Supabase secret manager;
5. implement the TAKATAK outbound client with the same contract;
6. verify one signed request in staging;
7. prove duplicate replay and conflict rejection;
8. verify a professional cannot see contact details until the existing FLEXS entitlement/contact flow permits it.

Until those gates pass, status is **Not configured**.
