# FLEXS task queue

Updated 2026-11-26. One line per item, in order. **Owner** items need the owner's hands (a key, a setting, a decision); everything else can be picked up by any agent. Tick an item only when it is verified, and say how.

## Waiting on the owner (nothing else blocks launch)

| # | Item | Done when |
| --- | --- | --- |
| O1 | Coolify: Build Pack **Dockerfile** (port 80, health check `/healthz`), then Deploy. Still needed for strict transport security, no-sniff, real 404s and the business sitemap; the content policy and frame protection no longer depend on it | `npm run check:live` passes its "host" line |
| O2 | Stripe: `STRIPE_SECRET_KEY`, webhook, `STRIPE_WEBHOOK_SECRET` (steps in `docs/GO_LIVE_CHECKLIST.md`) | A professional buys the smallest pack and the balance goes up |
| O3 | SMTP for sign-in emails; raise the email rate limit | A new address receives its sign-in link from a FLEXS sender |
| O4 | Notification emails by SMTP (owner's rule: no Resend): function secrets `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` (port 465, not 587) | The queued confirmation for the first live request is delivered |
| O5 | Twilio / MIMT: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | One real call connects a professional and a customer |
| O6 | Read the French text once; lawyer review of the legal pages (English and French); final wording of the professionals' terms | Owner's written OK |
| O7 | Apple and Google developer accounts; a Mac for the iOS build; run the phone checklist in `docs/MOBILE_APPS.md` on the test APK | Store listings created; checklist result in `WORKLOG.md` |
| O8 | Optional: `ANTHROPIC_API_KEY` (quote drafting), TAKATAK tokens, Cloudflare Turnstile key (captcha) | Each feature tested once |

## Open work for agents, in order

| # | Item | Done when |
| --- | --- | --- |
| A6 | Service guides (Figma frame 36:869): needs articles from the owner | Blocked on content |
| A7 | Desktop wizard frames between 19:828 and 24:5974: needs node numbers | Blocked on the scanner |

## Done and verified (most recent first)

- 2026-11-27 Home photo strip uses small copies (560 × 280) of the service photos: the eight photos weigh 113 KB instead of 421 KB. Checked sharp on a phone-sized screen. #37 verified live the same day: layout shift 0.00 on the home and services pages of flexs.ca.
- 2026-11-27 Page stability: on a phone the home page and the services page jumped when the services arrived (layout shift 0.49 and 0.58 measured on flexs.ca; above 0.25 counts as poor). Space is now reserved while they load: 0.00 on the built site, same measure. The first two home photos load at once and the browser connects to the backend earlier. Live figure to re-measure after merge.
- 2026-11-26 Security without waiting for the host: the build writes the content security policy into the page, the site refuses to render inside another site's frame, and the Apache `.htaccess` is no longer shipped in the public build. Found on the way: the form-validation library probed for `eval` on every page, which the policy reports; switched off. `npm run test:csp` loads 14 pages of the built site and fails on any violation (in CI). `npm run test:browser:built` runs all the browser scenarios on the built site under the policy, signed-in screens, map, uploads and payment return included (in CI).
- 2026-11-26 A5b PR #31 merged and live; the 2,470 Sherbrooke businesses are shown (155,634 in the directory). A Sherbrooke page checked on flexs.ca in both languages. The business sitemap picks them up once Coolify builds with the Dockerfile (O1).
- 2026-11-26 A8 Build and test tools upgraded (vite 5 → 7, vitest 3 → 5, React plugin 3 → 4, one pinned sub-dependency): `npm audit` went from 16 advisories (2 critical, 1 high, all in developer tools) to 0. Clean install, 136 tests, build, dev server and 33 browser scenarios pass. vite 8 is not used yet because the Lovable tagger plugin does not accept it.
- 2026-11-26 SECURITY: the public views (`provider_profiles_public`, `provider_reviews_public`, `leads_safe`, `lead_last_message`) are now read-only. Before, an anonymous visitor could rename or delete professional profiles and reviews through them (proven in a rolled-back test; no profile or review existed, nothing was touched). Migration 20261126110000 applied live and re-tested as a visitor and as a member; a database test now fails if any view becomes writable again.
- 2026-11-26 A5 Directory: Sherbrooke's open business directory (Entreprendre Sherbrooke, CC0 public domain). Importer and test in `scripts/`, licence in `docs/DIRECTORY.md`, 2,470 businesses loaded in the live database but shown since 17:17 UTC the same day, once PR #31 was live.
- 2026-11-26 A3 Customer request page: two or more quotes are shown side by side with the business name, price, availability, date and status; "Lowest price" is marked only when it is unambiguous; sort by price or date; accept, decline or message each professional from its card. Browser scenario with two quotes, French strings, checked at desktop and phone width.
- 2026-11-26 A2 Android: release signing from an untracked key file or build secrets, version numbers on the command line, one-click "Android app build" on GitHub (test APK + bundle), phone backups off, back button closes an open form instead of leaving the page. Signed and unsigned builds verified in a cloud session with a throwaway key; **not yet run on a phone** (checklist in `docs/MOBILE_APPS.md`).
- 2026-11-26 Notification emails switched from Resend to SMTP (owner's rule found in PR #33). Function redeployed; without the secrets it answers "not enabled" and leaves the queue alone.
- 2026-11-26 Owner dashboard: account search (email, name, business) with credits, requests, unlocks and amount paid; request dates. Function checked on the live database as the administrator and refused without.
- 2026-11-26 Store listing kit: `docs/store/LISTING.md` (both languages, lengths checked) and 20 screenshots at 1290 × 2796 and 1080 × 1920.
- 2026-11-26 French pages reachable by address (`?lang=fr`), alternate-language tags, both languages in the page sitemap. Verified in a browser.
- 2026-11-26 Coolify hosting configuration (PR #31). Tested under nginx; **not active on the live site until O1**.
- 2026-11-26 Service matching, postal codes, town suggestions (PR #30). Verified on the live site.
- 2026-11-21 Request wizard fits every window and advances by itself; email notifications; search engines; local photos; content security policy; intake limits; crash recovery and error log; accessibility; dependency fixes (PR #29). Wizard verified on the live site.
- 2026-11-21 French version; calls (hidden until O5); owner overview; administrator invitation; live-audit fixes (PR #28).
- 2026-11-21 Live database checks, rolled back: full journey, business claim, money path (`scripts/live-*-check.sql`).
- 2026-11-21 Figma parity BRIEF 3 to 5 (PR #23). Directory of 153,164 Quebec businesses.
