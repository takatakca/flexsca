# 00 — FLEXS — READ FIRST

Signed: **Claude (Claude Code cloud session on `takatakca/flexsca`)**. First written 2026-11-13 03:17 EST. Every agent updates this file on `main` before, during and after work.

## Apology and standing order (owner's instruction, 2026-11-13)

I am sorry. On 2026-11-13 between about 01:45 and 03:10 EST I changed production for FLEXS and wrote my notes only on a feature branch and in the chat. I left nothing on `main`, nothing in the Google Drive master folder and nothing on the agent board, and I did not read the open pull requests, issue #4 or the other agents' branches before starting. Other agents (Taktak, KLEAN, REVEW) therefore worked without knowing what I had done. That is corrected below.

**Order to every agent, starting with me. Never skip it:**

1. **Before** touching anything: read this file, `AGENTS.md`, `WORKLOG.md`, the open pull requests and issues (`gh api repos/takatakca/flexsca/pulls`, not only `gh pr list`), all remote branches (`git ls-remote --heads origin`), and the Drive master `00 — FICHIER MAÎTRE`.
2. **Before** the first change: write a signed "BEFORE" line here on `main` and a signed note in the Drive coordination folder.
3. **During**: add a signed line for every change to a live system (database, functions, auth settings, DNS, hosting, secrets) at the time it happens, not at the end.
4. **After**: write what was verified, what was not, and the exact next step, in the same three places (this file on `main`, `WORKLOG.md`, Drive).
5. A feature branch or a chat message is **not** a trace. If it is not on `main` and in Drive, other agents cannot see it.

## Current state (2026-11-13 03:17 EST)

| Item | State | Evidence |
| --- | --- | --- |
| Public site flexs.ca | **Down**: 403 Forbidden from an Apache server | Checked live 2026-11-13 by Claude and by Taktak |
| Backend | **Live** in Supabase project **ALKAO** (`ysghtkallwuoodwqgkjm`, ca-central-1), shared with the ticketing product | 50 migrations, 4 Edge Functions ACTIVE, live sign-up / request / unlock checks passed, test data removed |
| Old backend `vcaphsvudlseemkalawz` (Lovable) | Abandoned: not in the owner's Supabase organization or Lovable workspaces | Checked 2026-11-13 |
| Code for hosting, mobile and the ALKAO switch | On branch `claude/hosting-and-mobile-apps`, **PR #6**, not merged. Merge is the owner's decision | Head `843aecc`; 86 tests, typecheck, lint, build, 29 browser scenarios pass |
| `main` | Still points at the abandoned backend until PR #6 is merged | `.env` on `main` |
| Stripe | Not configured: buying credits fails | Function secrets absent in ALKAO |
| Auth email | Built-in Supabase sender, 2 emails per hour, ticketing templates and site URL | ALKAO auth config |
| Administrator | None in `platform_admins` | Live query |
| Android / iOS apps | Capacitor projects exist in PR #6. Never compiled, never run on a device | — |
| TAKATAK-V1 link | Code exists on both sides (`takatak-v1` `/api/integrations/ads/flexs/events`; FLEXS `takatak-attribution-worker`, `takatak-opportunity-intake`). **No secret is set, no real event has been exchanged** | — |
| AI | Not integrated in FLEXS. TAKATAK AI Nexus is the intended provider through an adapter (see `knowledgeAI/projects/TAKATAK-AI-NEXUS.md`) | — |

## What Claude changed on live systems on 2026-11-13 (all times EST)

Every item below was done through the Supabase management API or the Supabase connector. Nothing was changed on `takatak-v1`, DNS, Coolify, Stripe or any TAKATAK database.

1. **~02:20** ALKAO database: applied all FLEXS migrations in one transaction after a rolled-back dry run; recorded them in `supabase_migrations.schema_migrations`. 41 FLEXS tables and 2 storage buckets (`provider-media`, `request-attachments`) added. The 48 `ticketing_*` tables, `alkao_private` and `alkao_meta` were not touched.
2. **~02:24** ALKAO Edge Functions deployed: `create-checkout-session`, `stripe-webhook`, `takatak-attribution-worker`, `takatak-opportunity-intake` (all `verify_jwt=false`, as in `supabase/config.toml`).
3. **~02:26** ALKAO Auth: added `https://flexs.ca/**` and `https://www.flexs.ca/**` to the redirect allow-list. Site URL left as `https://billets.promohavana.ca/ops`.
4. **~02:31** ALKAO Data API: it exposed no schema; with the owner's explicit approval it now exposes `public`. Checked live: anonymous callers get "permission denied" on ticketing tables; a signed-in non-member sees zero ticketing rows.
5. **~02:33 and ~02:40** ALKAO database: migration `20261113080000_remove_signup_sample_leads` (sign-up no longer creates seven fake demo leads; internal helper functions no longer callable through the API).
6. Temporary test users and one test request were created and **deleted**; final check showed 0 FLEXS leads, 0 FLEXS profiles, 1 pre-existing auth user.
7. Cloud environment `flexsca` created in the owner's Claude account, holding a Supabase access token (not in any repository).

**Known side effects:** FLEXS and ALKAO ticketing now share one login table, so a new ticketing staff account also gets a FLEXS profile and wallet. One management-API response printed the ALKAO JWT secret into the session output; rotating it is recommended (Taktak listed this in PR #6).

## Not allowed

Do not alter or drop `ticketing_*`, `alkao_private`, `alkao_meta`, or the Auth site URL in ALKAO. Do not run FLEXS migrations in any TAKATAK database: `profiles`, `leads` and `notifications` collide there.

## Open work, in order

1. Owner: decide on merging PR #6.
2. Owner: Coolify resource from this repository (Dockerfile, port 80, `/healthz`) and DNS for flexs.ca.
3. Owner: Stripe secrets and a custom SMTP sender in ALKAO; first administrator.
4. Agent (Claude, in progress 2026-11-13): compile the Android app, OCR re-verification of every screen, in-app account deletion, TAKATAK-V1 link check, AI adapter. Progress lines go in the log below.

## Log (newest first; signed; one line per step)

- 2026-11-13 04:10 EST | Claude (Claude Code cloud, flexsca) | DURING — about to change live ALKAO | Applying migration `20261113100000_ai_assist_usage` (one new table `ai_assist_usage` and two service-role-only functions) and deploying new Edge Function `ai-assist`. It drafts a first quote message for a request the professional has unlocked; drafts only, 20 per day per account, customer contact details never sent to the model. It stays **off** until the owner sets the function secret `ANTHROPIC_API_KEY` in ALKAO; the button is hidden while it is off.
- 2026-11-13 04:05 EST | Claude (Claude Code cloud, flexsca) | AFTER (account deletion) | `delete-account` is live in ALKAO and tested with a temporary account: 401 without a session, 400 without typing DELETE, 200 with it; login, profile, wallet and statuses removed; old session rejected. Logins with no FLEXS profile, administrators, and anyone in `ticketing_memberships` or `ticketing_campaigns.created_by` are refused. TAKATAK-V1 link checked against `takatak-v1` code: the attribution contract matches on both sides (path, Bearer token `ADS_FLEXS_SERVICE_TOKEN` of 32+ characters, event types lead/form_submit/call/conversion, `{ok:true}` reply). Not live: the token is set on neither side, `FLEXS_WORKER_TOKEN` and a schedule for the worker are missing, and `takatak-v1` has no sender yet for the FLEXS opportunity intake (its R2F contract is still "offline contract only").
- 2026-11-13 03:45 EST | Claude (Claude Code cloud, flexsca) | DURING — about to change live ALKAO | Applying migration `20261113090000_account_deletion` (two service-role-only helper functions, no table change) and deploying new Edge Function `delete-account` to ALKAO. Purpose: in-app account deletion required by both app stores. It refuses administrators and any login that has a row in `ticketing_memberships`, so ticketing staff cannot be deleted through FLEXS.
- 2026-11-13 03:40 EST | Claude (Claude Code cloud, flexsca) | DURING | Android app compiled for the first time: debug APK 5.1 MB and unsigned release bundle 3.5 MB, package `ca.flexs.app`, target SDK 36 (Gradle 8.14.3, AGP 8.13.0, JDK 21). No emulator is available in the cloud session, so it has not run on a device. OCR audit (Tesseract eng+fra, phone size 390×844, live ALKAO backend): 15 public and 11 signed-in screens load with no errors. Found and fixed on the branch: old name "FLEX'S" on 4 files, 16 px sideways overflow on Settings. Cloud environment `flexsca` now also allows dl.google.com, maven.google.com, plugins.gradle.org.
- 2026-11-13 03:17 EST | Claude (Claude Code cloud, flexsca) | BEFORE | Read AGENTS/WORKLOG/handoff, PRs #5 and #6, issues #2 and #4, all remote branches, `knowledgeAI` (FLEX, AI Nexus, agent rules), `takatak-v1` (AGENTS, FLEXS endpoint, AI docs) and the Drive master index. Starting: Android build, OCR verification, account deletion, TAKATAK-V1 link check, AI adapter. The agent board (foodhubca#105) could not be written from this session: repository access was refused.
