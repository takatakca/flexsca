# Work log

- 2026-10-15 | ChatGPT | main | active | Implement opt-in provider service-area matching using owner-controlled preferences, RLS and server-only marketplace filters | SQL, profile UI/types, PGlite tests, release gates, CI, handoff

- 2026-10-14 | ChatGPT | main | done; CI green | Contact form keyboard submission, accessible labels/errors and Playwright Enter scenario; commits 435242bc and 07dd6258, 77 tests passed in CI #38624925575 | Unblock Supabase production access, then resume P1 queue

- 2026-10-14 | ChatGPT | main | done; production blocked | SQL duplicate guard, safer client feedback, PGlite checks, strict migration allowlist; pushed f7df3757 and 2dd00443 | CI #38624276910 succeeded; Supabase project access and production secrets still needed

- 2026-10-14 | ChatGPT | main | done; production blocked | Bounded TAKATAK intake streaming (18 KB), malformed UTF-8 handling and seven tests, plus eight runtime HMAC tests; created five project/handoff/runbook files | inspect latest CI for current main SHA, then resolve Supabase production access and continue P1 queue

- 2026-10-08 | codex | codex/flexs-marketplace-release | done | Merged owner instructions; 55 tests, 6 readiness tests and 27 browser scenarios pass; added six image/DOM/OCR evidence sets and CI artifact publication | provide SUPABASE_ACCESS_TOKEN and SUPABASE_DB_PASSWORD securely for deployment; expose Figma connector or supply design export for parity review

Newest first, one line per piece of work. Rule: `AGENTS.md` › Work log rule.
Format: `YYYY-MM-DD | agent | branch → PR | status | what | next step`

- 2026-10-14 | ChatGPT | main ← PR #3 | blocked: Supabase production access | Signed TAKATAK/R2F intake, HMAC fix, privacy defaults, migration and guarded main-branch deployment merged at 33bec04; PR CI green | GitHub production SUPABASE_ACCESS_TOKEN and SUPABASE_DB_PASSWORD are absent; grant access to FLEXS Supabase project, deploy backend, verify Stripe, Auth and signed intake

- 2026-10-08 | claude (owner setup) | default branch | done | Added the work log rule, this log and the stop reminder | every agent follows AGENTS.md › Work log rule
