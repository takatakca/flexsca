# FLEXS project status

Last reviewed: 2026-10-16. Repository: [takatakca/flexsca](https://github.com/takatakca/flexsca). Main branch: `main`.

## Current reality

**Not 100% complete; not verified as deployed to production.** Existing React/TypeScript/Vite marketplace and Supabase backend are preserved. PR #1 delivered the marketplace release and was merged. PR #3 delivered the signed TAKATAK/R2F lead-projection adapter and was merged on 2026-10-14 (merge SHA `33bec04a3ef3e249ba5e0fa6ccb82ee0906993ee`). Intake hardening commit `be61369802b770ca7f89a89d5b7d1374b141d73e` bounds streamed requests to 18,000 bytes, and subsequent commit `2a6747052b8b427cd7a7f1642fd97191088a3ca6` extracts the HMAC verifier and adds real cryptographic tampering, expiry, and identity-binding tests.

New native intake protection at feature commit `f7df3757f25f2df6b2b8c75549bf4ef5bbd88f6c`, plus the explicit deployment-history gate update `2dd00443654c40b0422550afc62c534cac1731b0`: the SQL RPC now rejects identical anonymous requests within ten minutes under the existing per-email advisory lock; the browser offers safe duplicate/quota guidance without revealing prior lead IDs. PGlite regression tests verify duplicate rejection and changed project descriptions; remaining CAPTCHA and genuine phone verification are not implemented. [Marketplace checks #38624276910](https://github.com/takatakca/flexsca/actions/runs/38624276910) succeeded on the anti-duplicate migration and client-feedback release.

The previously completed [Marketplace checks run #38610800042](https://github.com/takatakca/flexsca/actions/runs/38610800042) passed the CI suite for `961340d5`. Newer code CI: [Marketplace checks #38622879746](https://github.com/takatakca/flexsca/actions/runs/38622879746), for `2a674705`; verify its final conclusion before claiming the code fully checked. Do not reuse older successful runs as evidence for later code.

The [backend deployment #38610629598](https://github.com/takatakca/flexsca/actions/runs/38610629598) failed **before schema changes**: GitHub Actions environment `production` does not supply `SUPABASE_ACCESS_TOKEN`; `SUPABASE_DB_PASSWORD` was also empty in logs. The connected Supabase account did not have access to project `vcaphsvudlseemkalawz`. No deployed migration, function version, Stripe transaction, TAKATAK callback, or website release was verified. A public website request from this agent environment did not produce a usable response; hosting, DNS, TLS and deployed build remain **unverified**, not assumed down.

## Delivered implementation areas (code, not live certification)

- Mobile-first public intake, customer workspace and professional opportunity, response and reminder flows.
- Supabase Auth and tenant/role protections; credit unlock, Stripe checkout and webhook code.
- Reviews, private support tickets, admin controls and opaque TAKATAK attribution with leased delivery.
- TAKATAK/R2F signed, consent-gated inbound opportunity projection; category pricing controlled by FLEXS; deduplicated provenance.
- GitHub CI for typecheck, lint, database/unit tests, build, synthetic browser checks, Deno checks and visual evidence.
- Guarded GitHub Actions backend promotion requiring a recent recovery point, known migration history, required secrets and active functions.

Latest UI improvement: `435242bc` and `07dd6258` convert the customer contact step into an accessible form that accepts Enter-key submission, presents associated validation errors, and is exercised in the Playwright smoke suite. [Marketplace checks #38624925575](https://github.com/takatakca/flexsca/actions/runs/38624925575) succeeded on `07dd6258`: 77 Vitest/PGlite tests, TypeScript/lint, Python release gates, build, Playwright keyboard test and Deno checks all passed. No claim of live promotion is made.

## Service-area matching update — 2026-10-15

Code merged to `main`: `f45a96ffb69b82890b08a9cd3aeda3fe1b5a642f` adds private, owner-managed service city/province preferences and an opt-in PostgreSQL search restriction. `a02b603ecb116a9becf4dee23e1b79acaa948878` removes a misleading static map and inactive reason selector, corrects privacy copy, and tests province-specific restrictions. The API uses `auth.uid()` under invoker rights, does not accept a provider ID or matching city from the caller, and keeps already-contacted leads visible. This is normalized city/province matching, **not** geospatial radius/drive-time matching or automated service-category onboarding. Browser persistence test commit `ad7a14e025c3d19c77fd86d4ffd90f46178f10eb` adds a full UI fixture for saving and reloading service area preferences. The final [Marketplace checks #38735165455](https://github.com/takatakca/flexsca/actions/runs/38735165455) **passed** on that SHA: 78 Vitest/PGlite tests, TypeScript, ESLint, Python readiness tests, build, browser smoke/visual evidence and Deno typechecks/runtime tests. Production Supabase project access remains denied and no backend deployment was confirmed.

## Private request documents — 2026-10-16

Pushed additive private Storage and metadata migration `20261016190000_private_request_attachments.sql`. The bucket is private with 8 MB maximum files and a PDF/JPEG/PNG MIME allowlist. `request_attachments` metadata and object policies restrict writes/deletion to the request's verified customer owner and downloads to that owner or professionals whose lead was legitimately unlocked. The UI is integrated into `CustomerRequest` and contacted `LeadDetail`; downloads use authenticated Storage, **not public URLs**. Static types, PGlite role tests, upload/reload browser fixtures and deployment-history gates are included. Latest functional commit: `796445c763f77a0ab56c1f28d2486067bc3b1823` (customer-route Playwright upload/reload test). [Marketplace checks #38944358593](https://github.com/takatakca/flexsca/actions/runs/38944358593) **completed successfully**: 82 Vitest/PGlite tests, TypeScript, ESLint, production build, Python release gates, browser fixtures including the customer private-file flow and Deno checks passed.

**Not live-certified.** The Supabase connection still cannot administer project `vcaphsvudlseemkalawz`, backend workflow failed credential validation before deploying SQL, and frontend hosting remains unverified. An operational malware scan/quarantine workflow, server-authoritative per-request quota, orphan-object cleanup/retention and end-to-end real-account Storage acceptance are outstanding gates before activating private documents in production.

## Backend live in ALKAO, hosting and mobile preparation — 2026-11-13

**Backend is deployed and verified.** On the owner's instruction FLEXS now runs in the existing Supabase project **ALKAO** (`ysghtkallwuoodwqgkjm`, ca-central-1, organization `takatakca`), shared with the ticketing product (`ticketing_*` tables, billets.promohavana.ca). The old Lovable project `vcaphsvudlseemkalawz` is abandoned: it is outside the owner's accounts.

- All 50 migrations applied in one transaction after a rolled-back dry run; history recorded in `supabase_migrations.schema_migrations`. 41 FLEXS tables, 51 categories, buckets `provider-media` and `request-attachments`. The 48 ticketing tables were not changed.
- Four Edge Functions deployed and ACTIVE (version 1).
- ALKAO's Data API had no exposed schema. With the owner's approval it now exposes `public`. Ticketing tables give anonymous callers "permission denied" and give a signed-in non-member zero rows (checked live).
- `https://flexs.ca/**` and `https://www.flexs.ca/**` added to the Auth redirect allow-list. Site URL left as the ticketing value.
- Live checks with temporary data, all removed afterwards: anonymous category read; anonymous cannot read leads, profiles, wallets, messages, admin tables; request submission and 10-minute duplicate rejection; sign-up creates profile, 20 welcome credits and 7 statuses; marketplace search hides contact details; unlocking spends credits and reveals the contact; built site loads categories from the live backend in a browser with no errors.

**Fixed while verifying:** sign-up used to give every new account seven fake UK demo leads (fake names, emails, phone numbers). Migration `20261113080000_remove_signup_sample_leads.sql` removes that and stops anonymous callers running internal helper functions. The About page (invented London head office, international hubs, staff perks), the Affiliate page (promised "$100/£80" payouts for a programme that does not exist) and invented testimonials with a "4.89/560" rating on service pages were replaced or removed.

**Still not done:** website is not hosted (flexs.ca answers 403 from an Apache server; Coolify deployment is an owner action, see DEPLOYMENT). Stripe secrets are not set, so buying credits fails. TAKATAK integration secrets are not set. Auth email uses Supabase's built-in sender, limited to 2 emails per hour and sharing ALKAO's templates and site URL: a custom SMTP sender is required before launch. No administrator exists in `platform_admins`. No store build exists.

**Shared-project consequences to know:** FLEXS and the ticketing product share one login table; any new ticketing staff account also gets a FLEXS profile and wallet. Supabase advisor reports three FLEXS views as security-definer (intended privacy-filtered projections, covered by tests) and leaked-password protection off.

Also on branch `claude/hosting-and-mobile-apps`: Coolify `Dockerfile` and nginx config, web-app manifest and icons, Capacitor 8 Android and iOS projects. See [MOBILE_APPS](MOBILE_APPS.md) and [DEPLOYMENT](DEPLOYMENT.md).

## Known remaining obligations

Production credentials, migration reconciliation, backups/restore confidence, deployment and real-system verification are **P0**. TAKATAK outbound counterpart and professional lifecycle event delivery are not complete. Shared TAKATAK Auth has no approved cross-project session exchange. Roadmap gaps include abuse/CAPTCHA and phone validation, professional service areas, private attachments, external notifications, account data lifecycle, subscriptions and further UX/accessibility checks. None is falsely marked complete.

See [TASK_QUEUE](TASK_QUEUE.md), [DEPLOYMENT](DEPLOYMENT.md), [DECISIONS](DECISIONS.md), [AGENT_HANDOFF](AGENT_HANDOFF.md), [FLEXS_RELEASE](FLEXS_RELEASE.md) and [FLEXS_PRODUCT_ROADMAP](FLEXS_PRODUCT_ROADMAP.md).
