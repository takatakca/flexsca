# FLEXS task queue — oldest unfinished blocker first

Updated 2026-10-16. The order can change only with a documented reason. Track each item as **done / active / blocked / queued**; passing fixture-based tests does not verify production.

| Priority | Status | Task | Done when |
| --- | --- | --- | --- |
| P0 | blocked: access | Verify FLEXS Supabase project membership and securely configure GitHub environment `production` secrets `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` | Read-only readiness can access the *correct* project, with no credentials committed |
| P0 | blocked: access | Check restore point, remote migration history and required server-side secrets | `backend-readiness.py` succeeds; inspect drift and explicitly confirm backup recovery |
| P0 | blocked: preceding gates | Deploy existing backend SQL migrations and all four Edge Functions from `main` | GitHub backend deployment is successful, functions ACTIVE, privileged RPC checks pass |
| P0 | blocked: access | Verify Stripe test-mode payments, Auth redirects/email, administrator bootstrap, worker schedule and tenant isolation | Real staging checks and signed acknowledgements recorded; no synthetic/live confusion |
| P0 | blocked: hosting identification | Identify the actual frontend host, configure build delivery after backend readiness, SPA fallback, DNS and TLS | Live `flexs.ca` and deep routes serve the correct verified revision |
| P1 | code pushed; current CI verification required | Bound TAKATAK signed-intake body size and test real HMAC authentication | 18 KB cap, UTF-8 rejection, eight signature and seven streaming tests pass on committed SHA and Deno typecheck is green |
| P1 | queued | Complete GitHub issue #2: counterpart TAKATAK outbound sender and FLEXS professional lifecycle events (view/contact/respond/win/loss) | Agreed event contract; authenticated, tenant-scoped, idempotent callback outbox, retry tests and staging acceptance |
| P1 | code complete for duplicate guard; CI green; live deploy blocked | Exact anonymous-request duplicate prevention and mailbox limit | 10-minute exact duplicate rejection and 3-per-15-minute quota passed PGlite CI #38624276910; requires real production rollout verification |
| P1 | queued | CAPTCHA, independent spam signals and genuine phone verification | Safe server-side challenge verification, abuse controls and consent-aware phone OTP tests in staging |
| P1 | code verified, production gated | Private service-area city/province preferences, opt-in server-side matching and RLS checks | CI #38735165455 green (78 tests + browser persistence); real Supabase deployment and staging RLS checks still needed; multi-city/radius, remote-work rules remain open |
| P1 | code + CI green, production release blocked | Private customer attachments (PDF/JPEG/PNG) | #38944358593 passed 82 tests, browser upload/reload and Deno. Live Supabase policy acceptance, malware scan/quarantine, server file-count quotas, orphan cleanup, retention and audit remain required |
| P2 | queued | External notification delivery, professional verification/disputes, data deletion/retention, subscriptions | Specific product requirements, migrations, permissions and integration tests |
| P2 | partial: contact form CI green | Remaining mobile/a11y review, conversion metrics, worker alarms and representative load tests | Keyboard Enter submission, associated errors and Playwright smoke verified in CI #38624925575; other screens and monitoring remain |

## Execution rules

Choose an independent task while a P0 item is access-blocked. Avoid implementing TAKATAK lifecycle callbacks against a guessed endpoint or relaxing row-level authorization. Respect `AGENTS.md` and update `WORKLOG.md` and `AGENT_HANDOFF.md` in the same work session. Prefer CI on the specific commit before merging/deploying; document unresolved errors, do not force-push or forge successful production status.
