# FLEXS marketplace release

FLEXS is an independent product at **flexs.ca**, designed to connect to TAKATAK V1. The TAKATAK repository at `8adfa23ca50f52f6a49e0eaec68e933c68dd1c78` defines `/services/lead-generation` as the service destination and `/api/integrations/ads/flexs/events` as the attribution contract. This change implements a marketplace release; it does not establish complete Bark feature parity.

## Delivered behavior

- Provider overview with database-backed opportunities, unlocked contacts, due follow-ups, wallet balance, reviews, and latest requests; desktop sidebar and mobile navigation.
- Customer questionnaire with string and checkbox answers, shared validation, server-side category/input checks, and mailbox submission limits.
- Customer sign-in returns to the requested page; verified email ownership claims matching guest requests. Customers can view existing requests, compare quotes, reply privately, and close requests.
- Paid contact unlocking is serialized per lead. Providers cannot forge purchases, change protected unlock fields, or read contacts and free-text data before unlocking. Private threads are isolated between professionals.
- Structured CAD quotes, customer acceptance/decline, single accepted quote, and closed-request enforcement.
- Verified customer reviews tied to confirmed-email request ownership and an accepted quote. One final review per request; professionals cannot delete verified feedback, and public review data excludes request IDs and customer emails. Verification identifies the customer relationship, not independently inspected work.
- Newly unlocked conversations remain visible under Pending when no custom status exists; loading failures offer a retry.
- Paid-contact follow-ups with future-date/note validation, request deduplication, protected delivery fields, and one in-app notice per due reminder. Notifications are collected while the professional app is open, with 30-second refresh; no background email/SMS/push delivery is claimed.
- Persistent per-account message and reminder preferences, unread notification badges, password recovery with confirmation validation and global sign-out, account name/email settings, and a credit wallet with real history and Stripe checkout.
- Review management uses a working public-profile link, clearly distinguishes verified and imported feedback, and exposes deletion only for imported reviews. Unimplemented Facebook-import and email-invitation actions no longer claim success.
- Private customer replies check professional entitlement through an ownership-gated helper, avoiding professional-only state RLS blocking legitimate replies.
- Quote reporting counts each request once and shows quote estimates, acceptance, and credit spending/refunds for all time or 30-day quote cohorts. Estimates are not collected revenue.
- In-app message/quote notifications and a provider credit-refund request flow.
- Server-managed administrator access, lead moderation, audited refund decisions, and exactly-once credit refunds. No editable user metadata confers administrator access.
- Checkout redirects use configured HTTPS origins. Webhooks require a paid, matching package and an existing purchase record. Fulfillment is service-only and serialized by checkout session.
- Public profiles respect private-location settings. Public reviews exclude reviewer emails; providers cannot mark imported reviews verified or edit merchant reputation/verification.
- Opaque `ttclid` capture and a durable TAKATAK attribution outbox. Only requests tied to a verified email owner enqueue a lead event. Delivery uses leases, stable event IDs, and bounded exponential retries. Personal lead information is never sent to TAKATAK attribution.
- Paginated marketplace search with server-side full-text filters, stable ordering, per-professional archive views, timezone-aware dates, retryable errors, and privacy-safe result counts.
- Lazy-loaded routes, separated framework/backend bundles, repaired npm lockfile, and automated checks.

## Local verification

Use the existing isolated checkout; do not create a Git worktree unless explicitly requested.

```sh
cd /workspace/flexsca
npm ci --no-audit --no-fund
npm run typecheck
npm run lint
npm test
npm run build
npm run test:browser
```

The database tests execute every repository migration against PGlite PostgreSQL with Supabase platform-schema fixtures and actual role/RLS checks. They do not substitute for concurrent requests and authentication against a deployed Supabase instance. Browser tests intercept backend responses and never create real leads, send emails, or charge cards. `CHROMIUM_PATH` can select a system browser; otherwise the test uses `/usr/bin/chromium` or Playwright's installed Chromium.

Edge Functions were typechecked with Deno 2.5.6:

```sh
deno check --node-modules-dir=none --no-lock \
  supabase/functions/create-checkout-session/index.ts \
  supabase/functions/stripe-webhook/index.ts \
  supabase/functions/takatak-attribution-worker/index.ts
```

In this cloud environment, `DENO_TLS_CA_STORE=system` is needed to trust the platform's installed proxy CA. TLS verification remains enabled.

## Current validation evidence

40 Vitest tests passed (39 functional/security checks plus the existing example), nineteen browser smoke checks passed with API fixtures, TypeScript and the production build passed, and ESLint passed with nine existing fast-refresh export warnings. The largest emitted JavaScript chunk is approximately 215 KB instead of the previous 1 MB bundle. All three Edge Functions passed Deno typechecks; the Stripe SDK signature runtime test passed with local fixtures. A read-only request to the hosted Supabase category API returned HTTP 200. GitHub Actions itself has not been observed running in this task.

## Promotion order

The new frontend requires the new backend RPCs. **Apply the backend release before promoting the frontend.** Keep this branch separate from `main` until deployment is verified; the README says main commits synchronize to Lovable.

1. Provide Supabase management access securely in environment settings. `python scripts/release-preflight.py` verifies access and lists missing migration history without mutation. Inspect any schema drift and capture a database backup before applying migrations.
2. Apply the ten `20261007*` migrations in filename order through the existing Supabase migration/deployment workflow. Do not replay historical category seeds on a live database merely to reconcile history. The automated database suite proves the complete migration sequence on a fresh local schema; the live project's history was not verified without management access.
3. Deploy `create-checkout-session`, `stripe-webhook`, and `takatak-attribution-worker` using the authenticated Supabase deployment workflow for project `vcaphsvudlseemkalawz`. The config disables platform JWT verification because checkout validates user claims, the Stripe webhook verifies its signature, and the worker verifies its scheduler token internally.
4. Set these **server-side Supabase function secrets** securely: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ADS_FLEXS_SERVICE_TOKEN` (the same value as TAKATAK V1, at least 32 characters), and `FLEXS_WORKER_TOKEN` (a separate random token of at least 32 characters). Supabase supplies its URL, anon key, and service-role key. Never expose these secrets in Vite variables or commit them.
5. Configure `TAKATAK_BASE_URL` as the confirmed HTTPS origin (default `https://takatak.ca`). Set `FLEXS_ALLOWED_ORIGINS` to the deployed frontend HTTPS origins, comma separated (default `https://flexs.ca,https://www.flexs.ca`). Add any genuine staging origin explicitly.
6. Register the Stripe webhook for `checkout.session.completed` and `checkout.session.async_payment_succeeded`; test with Stripe test mode. The browser's checkout return is not payment confirmation.
7. Schedule a POST to the deployed `takatak-attribution-worker` function every minute with `Authorization: Bearer <FLEXS_WORKER_TOKEN>`, storing the token in the scheduler's secure secret facility. Each batch claims five jobs for a two-minute lease. Monitor undelivered rows with `attempts >= 12`; after fixing the cause, an administrator can reset attempts/next_attempt_at through a privileged database operation. Do not put the scheduler token in browser code.
8. Bootstrap the intended administrator by inserting their existing profile UUID into `public.platform_admins` through a trusted database administrator connection. The application cannot self-bootstrap an administrator. `/app/admin` is denied to other users.
9. Verify Supabase Auth allows the real FLEXS `/auth/callback` URL and the development/staging callback URLs. Also allow the real `/auth/reset-password` URL. Verify the recovery email template preserves Supabase’s recovery redirect. Use verified test users to check the customer/provider/admin flows, recovery, email changes, and cross-user isolation. Google and Apple OAuth are opt-in: configure the provider in Supabase Auth and then set `VITE_AUTH_GOOGLE=true` or `VITE_AUTH_APPLE=true` for the frontend. Keep both unset until configured; client variables never contain provider secrets. Set up production email delivery in Supabase Auth.
10. Test concurrent duplicate payment webhooks and simultaneous unlocks in staging; confirm one debit/credit, single first responder, no private-thread leakage, and no lost outbox jobs. Verify live TAKATAK accepts the event and safely deduplicates retries.
11. Promote the frontend, configure the hosting SPA fallback to `index.html` for client routes, and verify flexs.ca DNS/HTTPS and deep links. Roll back the frontend on a failed smoke check; retain the additive backend schema for investigation rather than deleting customer data.

## Remaining product work and live release gates

The current repository does not provide all Bark capabilities. Service-radius/geospatial matching, independent certification of completed work, phone verification, email/SMS/push delivery, CAPTCHA-backed anonymous intake, provider verification operations, subscriptions, marketing analytics instrumentation, self-service account deletion, and enterprise support/dispute tooling require further product implementation and deployment testing. High-volume search indexing and query-plan measurements also remain deployment work. Existing provider-imported reviews remain unverified. Mailbox limits do not provide complete anonymous bot protection. Requests become attribution-verified only after confirmed-email ownership, not simply because a visitor posted a form.

No production migration, function deployment, Stripe payment, Auth email, DNS change, or live TAKATAK event was performed by this release without the required access and server secrets. Neither other ChatGPT projects nor a deadline promise were used as a substitute for implementation evidence.
