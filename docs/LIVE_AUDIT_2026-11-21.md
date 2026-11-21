# FLEXS — Live site audit, flexs.ca — 2026-11-21 (Claude, signed note)

Checked live at about 02:15 (Montréal time) in Chrome, logged out, desktop window 1107×666.

## What's actually live
- flexs.ca now answers (Apache, MochaHost). Files were uploaded **2026-11-21 05:38 UTC (00:38 Montréal)**.
- **The live build is older than main / PR #25.** Proof: `/sitemap.xml` still lists `https://flexsca.lovable.app/...`, there are no security headers (no HSTS, X-Frame-Options or CSP in the response), and several pages still share the generic title "FLEXS — Professional Lead Marketplace" (/pro, /about, /terms, /auth/login, /post-job).
- **Action:** merge PR #25, then redeploy from main (the "Deploy FLEXS website" workflow, or upload `dist/` by hand, including `.htaccess`). Then check all the items below again, because some may already be fixed on main.

## P0 — blockers (customers or pros can't get through)
1. **The request form can't be completed on a laptop-height screen.** /post-job/plumbing: the step 1 modal is taller than the window, and **the modal doesn't scroll**, so "Continue" sits at y=738 in a 666 px viewport and can't be reached. The mouse wheel and scroll-into-view do nothing. Fix: give the modal body `max-height: calc(100dvh - X)` with `overflow-y: auto`, or a sticky footer that holds Continue/Back. Test at 1366×600, 1280×650 and on phones.
2. **"Contact us" (/support) sends logged-out visitors to the professional onboarding** (`/auth/welcome?next=/support`, "Welcome to FLEXS for professionals 👨‍🔧"). A customer or a business that wants its listing removed can't reach support. The terms and the directory footer both say "contact us" to correct or remove a listing, so this is also a compliance problem. Fix: make /support public, with a form or a mailto to support@takatak.ca.
3. **No French version.** The site targets Québec only (directory "across the province", terms governed by Québec law), but everything is English only, and `<html lang="en">` with no language switch. Under Québec's Charter of the French Language (Bill 96), commercial websites aimed at Québec must be available in French, at least as fully as in other languages. *(Not legal advice; have it checked.)* This is both a launch blocker and the biggest UX issue: users will type "plombier", and search returns nothing for it today.

## P1 — serious
4. **The home search is a dead end without autocomplete.** Typing "plumb" or "plombier" shows no suggestions. Search goes to /post-job?q=…, where the user has to click the service a second time. Add a suggestion dropdown (FR + EN synonyms) and go straight to the matching service when there's one clear match.
5. **The request form is slow to open:** "Please wait…" for about 3–5 s on a blank grey screen. Preload the questions or show a skeleton screen.
6. **Copy is British, not Canadian or Québec:** "Leaking tap", "Boiler issue", "Removals", "Garden Maintenance", "Painting & Decorating", "Corporate Coach and Minibus Hire", "Dog Walking" (Bark leftovers). Use "Faucet", "Water heater", "Moving", "Landscaping / lawn care", and so on, and add French equivalents.
7. **Images:** all 22 images on the home page have **empty alt text** (accessibility, SEO). One is **broken**: `images.unsplash.com/photo-1504711434969-e33886168d6c`. Images are also hot-linked from Unsplash; self-host them, optimised as WebP.
8. **"Mobile App" (/open-in-app)** tells everyone, customers included, "You'll need to use the FLEXS for Professionals app", with no App Store or Play Store link. Hide it until the apps are published, or link to the stores.
9. **The login page has no "Create an account" link** for customers. Only Login, Forgot password and magic link are offered.
10. **The 404 page is a "soft 404":** unknown URLs return HTTP 200 (SPA fallback). The visible page is fine. Make sure `noindex` is set on it (or use prerendering) so Google doesn't index junk URLs.

## P2 — directory / data quality
11. "Request quote" appears on unclaimed national chains (A & W, A & W #5761, A & W Eaton Center…). A quote request to a fast-food franchise doesn't make sense, and big brands may object to being listed with a quote button. Hide "Request quote" for restaurants, retail and similar categories, or for non-service categories altogether.
12. Duplicates and noisy names (A & W ×7+, "A À Z", store numbers in names). Dedupe by name, address and source.
13. Category mismatches: "A @ Z Serrurier" (locksmith) is under Construction; "A.D.A. climatisation" (HVAC) is under Plumbing.
14. Region formatting: "Saguenay--Lac-Saint-Jean" and "Gaspésie--Îles-de-la-Madeleine" show a double hyphen; it should be an en dash or a single hyphen.
15. The directory first renders "Loading businesses…" with the footer jumping up. Reserve the height or show a skeleton list.

## P2 — legal and trust (owner to decide; not legal advice)
16. Terms: the "credit purchases are final", liability cap and Montréal-court clauses may not hold against **consumers** under Québec's Consumer Protection Act. Pros are businesses, so it matters less there, but have a Québec lawyer review it. The operator is named "Groupe TAKATAK inc."; confirm that's the legal entity that will contract and take payments.
17. The cookie policy is linked, but no consent banner was seen. Québec Law 25 needs consent for non-essential trackers. Add a banner, or confirm that no analytics run.
18. Terms for Professionals is still a draft (waiting on the owner's wording).

## Already known, still open (from builder notes)
- Stripe keys and the 2 webhook events → no credit purchase possible.
- SMTP → only about 2 confirmation emails per hour.
- No admin account → business claims can't be approved.
- Auth hardening (password min 6, no captcha, leaked-password check off) → waiting for the owner's yes.
- AI assistant and TAKATAK keys; service guide articles; middle Figma wizard node numbers.

## Order of work for the builder session
1. P0-1 (modal scroll), P0-2 (public /support).
2. Get PR #25 deployed to MochaHost so the live site = main.
3. P1-4, 5, 6, 7, 8, 9.
4. French i18n (P0-3): scaffold `fr-CA` as the default for Québec, with a language toggle in the header and footer and FR synonyms in search.
5. Directory clean-up P2-11 to 15.
