# FLEXS deployment runbook

Scope: `takatakca/flexsca`; frontend `flexs.ca`; independent Supabase project ref `vcaphsvudlseemkalawz`. **The actual frontend hosting service has not been verified.** Do not infer MochaHost, Lovable, Vercel or any other provider from repository history.

## Verified automation

- `.github/workflows/marketplace-checks.yml`: `main` pushes and PRs; runs npm installation, TypeScript, lint, tests, Python readiness checks, build, browser fixtures, Deno checks and visual audit artifact.
- `.github/workflows/deploy-backend.yml`: `main` pushes touching backend/deployer, plus `workflow_dispatch`. Uses GitHub environment `production`, validates secure secrets, then invokes `scripts/deploy-backend.sh` after full checks.
- `scripts/backend-readiness.py`: read-only migration-history, recent backup/recovery point, secret-name and post-deploy function/privilege checks. Does not write or print secrets.

The backend run [#38610629598](https://github.com/takatakca/flexsca/actions/runs/38610629598) exited at credential validation. It **did not deploy**. Never infer deployment from a passing marketplace CI job.

## Recovery and backend deployment (authorized operator)

1. Confirm the authorized Supabase project really is `vcaphsvudlseemkalawz`; grant the deployment identity access through normal Supabase organization controls. Inspect existing DB migration history and backups before any mutation.
2. Set `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` in GitHub **Settings → Environments → production → Environment secrets**. Configure secure function secrets in Supabase: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ADS_FLEXS_SERVICE_TOKEN`, `FLEXS_WORKER_TOKEN`, `TAKATAK_FLEXS_INTEGRATION_ID`, `TAKATAK_FLEXS_OPPORTUNITY_SECRET`. Inspect existing names first; do not overwrite keys blindly. A publishable frontend anon key is not a management token.
3. Verify recovery is available and remote migrations contain no unknown/missing historical versions. Execute `python3 scripts/backend-readiness.py` with securely injected management credentials.
4. Run/dispatch **Deploy FLEXS backend** on `main`. The approved pending-history gate includes the twelve `20261007*` release migrations, `20261010090000` TAKATAK provenance, `20261014194000` anonymous-intake duplicate protection, `20261015093000` provider service-area preferences / marketplace matching, and `20261016190000` private customer attachments (after the existing email quota). Its deploy script applies only approved pending migrations in order and publishes `create-checkout-session`, `stripe-webhook`, `takatak-attribution-worker`, `takatak-opportunity-intake`. Never apply migrations against an unidentified project.
5. Read the entire workflow log. Confirm post-deployment `backend-readiness.py --verify-deployed`, deployed function versions, migration history, RLS boundaries, signed TAKATAK request replay and consent rejection. Configure worker scheduler and Stripe webhook in trusted server environments and verify end-to-end.
6. Identify the **actual** frontend hosting environment, document URL/build/deployment method and configuration. Build the Vite frontend off-host if the platform requires it. Promote only after backend readiness, configure SPA fallback and correct HTTPS origins/Auth redirects, then verify `/`, `/post-job`, `/auth/callback`, `/app/leads` (authorized sessions), and browser error logs.
7. Record deployed commit SHA, action URL, environment, checked endpoints, and rollback owner in `PROJECT_STATUS.md`/`AGENT_HANDOFF.md`.

### Service-area activation checklist

After the new migration is applied, use two independent professional accounts. Confirm an opted-in city/province filter matches only new leads in that service area, leaves purchased/contacted leads visible and does not affect the second professional. Assert anonymous and unrelated accounts cannot access `provider_profiles` preferences, and `provider_profiles_public` does not include the private fields. Do not claim geospatial distance, map accuracy or automatic job assignment: matching is city/province equality only. Confirm the profile save persists server-side before promoting the frontend. Fixture-based browser save-and-reload was validated by CI #38735165455; live Supabase persistence is **not** verified.

### Private documents activation checklist

Do not enable public document uploads on production until the following are verified with real dedicated test accounts: Supabase Storage bucket `request-attachments` is **private**, 8 MB capped and restricted to PDF/JPEG/PNG MIME types; a customer who has claimed a request can upload and remove only that request's objects, unauthorized customers and anonymous users cannot list or upload, an uncontacted professional cannot fetch or enumerate the bucket, and a contacted professional can download but cannot upload/delete. Confirm customer and contacted-pro role tests against deployed Supabase, not just PGlite or intercepted Playwright fixtures. Verify the upload happens via the Storage API; never write only `storage.objects` metadata.

Before activation, agree and implement scanning/quarantine of untrusted PDFs/images, a **server-side** file-count/storage quota (10-file UI cap is not authoritative), an orphan-object reconciliation worker, document retention/deletion policy and operational/audit ownership. The current implementation does not claim those controls. Fixture browser upload/reload, owner/pro entitlement and SQL tests passed CI #38944358593; **this is not deployed Storage verification**. Do not use public file links or durable signed URLs.

## Production smoke and rollback

Use dedicated test identities and Stripe **test mode** first. Check unauthorized contact reads and cross-tenant access, concurrent credit unlock and webhook replays, quote ownership, customer consent, and idempotent HMAC intake. Do not charge real cards during smoke tests.

On frontend regression, roll back the host's frontend artifact to the last known working revision. Preserve additive database migrations and customer data pending review; do not blindly reverse schemas or delete users. Revoke leaked credentials separately if needed.

## Never claim

A committed change, successful fixture tests, an HTTPS homepage response, or a deployment job that stops before migrations **is not** proof that the entire product is live. Document unverified infrastructure honestly.
