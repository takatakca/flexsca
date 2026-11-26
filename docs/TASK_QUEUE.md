# FLEXS task queue

Updated 2026-11-26. One line per item, in order. **Owner** items need the owner's hands (a key, a setting, a decision); everything else can be picked up by any agent. Tick an item only when it is verified, and say how.

## Waiting on the owner (nothing else blocks launch)

| # | Item | Done when |
| --- | --- | --- |
| O1 | Coolify: Build Pack **Dockerfile** (port 80, health check `/healthz`), then Deploy | `npm run check:live` passes its "host" line |
| O2 | Stripe: `STRIPE_SECRET_KEY`, webhook, `STRIPE_WEBHOOK_SECRET` (steps in `docs/GO_LIVE_CHECKLIST.md`) | A professional buys the smallest pack and the balance goes up |
| O3 | SMTP for sign-in emails; raise the email rate limit | A new address receives its sign-in link from a FLEXS sender |
| O4 | Resend: domain `flexs.ca`, `RESEND_API_KEY` | The queued confirmation for the first live request is delivered |
| O5 | Twilio / MIMT: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | One real call connects a professional and a customer |
| O6 | Read the French text once; lawyer review of the legal pages (English and French); final wording of the professionals' terms | Owner's written OK |
| O7 | Apple and Google developer accounts; a Mac for the iOS build | Store listings created |
| O8 | Optional: `ANTHROPIC_API_KEY` (quote drafting), TAKATAK tokens, Cloudflare Turnstile key (captcha) | Each feature tested once |

## Open work for agents, in order

| # | Item | Done when |
| --- | --- | --- |
| A2 | Android: signed release build instructions and a device test checklist | `docs/MOBILE_APPS.md` updated; debug build installs |
| A3 | Customer dashboard: compare quotes side by side | Browser scenario covers two quotes on one request |
| A4 | Owner dashboard: list and search accounts and requests, with dates | Administrator can find a request by email or town |
| A5 | Directory: one more open-data source outside Montréal (Québec City, Gatineau or Laval), CC BY or compatible only | Importer script, licence recorded in `docs/DIRECTORY.md` |
| A6 | Service guides (Figma frame 36:869): needs articles from the owner | Blocked on content |
| A7 | Desktop wizard frames between 19:828 and 24:5974: needs node numbers | Blocked on the scanner |

## Done and verified (most recent first)

- 2026-11-26 Store listing kit: `docs/store/LISTING.md` (both languages, lengths checked) and 20 screenshots at 1290 × 2796 and 1080 × 1920.
- 2026-11-26 French pages reachable by address (`?lang=fr`), alternate-language tags, both languages in the page sitemap. Verified in a browser.
- 2026-11-26 Coolify hosting configuration (PR #31). Tested under nginx; **not active on the live site until O1**.
- 2026-11-26 Service matching, postal codes, town suggestions (PR #30). Verified on the live site.
- 2026-11-21 Request wizard fits every window and advances by itself; email notifications; search engines; local photos; content security policy; intake limits; crash recovery and error log; accessibility; dependency fixes (PR #29). Wizard verified on the live site.
- 2026-11-21 French version; calls (hidden until O5); owner overview; administrator invitation; live-audit fixes (PR #28).
- 2026-11-21 Live database checks, rolled back: full journey, business claim, money path (`scripts/live-*-check.sql`).
- 2026-11-21 Figma parity BRIEF 3 to 5 (PR #23). Directory of 153,164 Quebec businesses.
