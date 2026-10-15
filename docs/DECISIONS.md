# FLEXS technical decisions and boundaries

Reviewed 2026-10-15. Distinguish documented architecture from verified integration.

| Decision | Rationale | Evidence / status |
| --- | --- | --- |
| Preserve existing React/Vite/Supabase marketplace | Reuse working code, protect customer data and business state | PR #1 merged; existing frontend/backend |
| FLEXS is a separate product, TAKATAK is the master identity/data authority across products | Each professional business sees only entitled data; no automatic merger of dashboards or CRM | Architecture direction; shared-login token exchange **not implemented** |
| TAKATAK/R2F communicates through a signed adapter, never direct cross-database access | Restrict PII, avoid duplicate opportunities and enforce server permissions | PR #3; `takatak-opportunity-intake` |
| Reject external contact disclosure by default, require explicit authorization and at least one valid contact | Prevent unauthorized personal-data exposure and mis-selling of credit unlocks | Additive migration, parser and tests; live proof pending |
| HMAC includes timestamp, event ID and exact body; reject over-limit data during streaming | Bound memory exposure of the unauthenticated public Edge Function; preserve signature identity | `bounded-body.ts`, `takatak-signature.ts` and runtime HMAC/streaming tests |
| Match provider-defined private service city/province on the server only when opted in | Keep marketplace matching owner-scoped, distinct from public business location; retain access to already purchased contacts | `20261015093000_provider_service_area_matching.sql`, location UI, PGlite/RLS and browser persistence fixtures (CI #38735165455 succeeded); live deployment pending |
| Native public intake serializes submissions per mailbox and denies identical requests for 10 minutes without returning prior lead IDs | Limits accidental duplicate paid leads while retaining 3-per-15-minute quota and distinct customer scopes; not a replacement for CAPTCHA/phone verification | `20261014194000_guest_lead_deduplication.sql`, client feedback and PGlite tests; production deployment pending |
| FLEXS controls opportunity credit pricing, not the source | Prevent cross-product pricing bypass | Existing server category lookup |
| Unknown cross-product callback schema is not invented | Prevent broken or insecure events and identity linking | Lifecycle event feature remains open in issue #2 |
| Backend before frontend | New UI depends on database RPCs and Edge Functions | Guarded `deploy-backend.yml`; blocked pending production credentials |
| Do not infer hosting provider from existing repo branding | Avoid publishing to wrong servers | Frontend host and live version not verified |
| Keep production secrets off-client and out of Git | Publishable frontend keys cannot authorize writes to master services | GitHub environment + Supabase server secrets |
| Agent resume uses GitHub documents and `WORKLOG.md` | Resumable work without rewriting other agents' changes | `AGENTS.md`, `PROJECT_STATUS.md`, `TASK_QUEUE.md`, `AGENT_HANDOFF.md`, `DEPLOYMENT.md` |

A future external orchestrator requires its own user-approved configuration and credentials. This repository documentation alone cannot restart an ended session.
