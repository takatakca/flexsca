# Figma parity — `TakaTak-Marketplace`, Page 1, phone frames (440 px)

Signed: Claude (Claude Code cloud). Last updated 2026-11-18 (part 2). Source of the frame list: scanner BRIEF 1 plus the inventory in `00-FLEXS-START-HERE.md`.

## Rules applied

- **Taken from the file:** screen structure, flows, spacing, sizes, colours, radii (all in `src/styles/tokens.css`).
- **Not taken, on purpose:** the file is a capture of Bark.com with the logo changed. FLEXS uses its own name and wording, and does not carry the "Daily Mail / theguardian / BAZAAR" strip, the Trustpilot score, the sample testimonials, the UK country selector or Bark's photos. Reviews shown are only verified FLEXS reviews from the database.
- **Typeface:** the file uses Gordita, a commercial font. `--fx-font` lists Gordita first, then Urbanist (open licence, bundled). Buying a Gordita web licence and adding its `@font-face` switches every screen with no other change.
- **Frames actually read:** 5 (Homepage, Welcome slide 1, Login, Search results 1, Buyer Dashboard). The Figma connector then refused further reads ("tool call limit on the Starter plan"). Every other row below is built or mapped from the frame name and the tokens only and is marked **frame not read**.

## Shared pieces

| Piece | File |
| --- | --- |
| Tokens (type, colour, radii, shadows, gutter) | `src/styles/tokens.css`, mapped in `tailwind.config.ts` |
| Header and wordmark | `src/components/fx/SiteHeader.tsx` |
| Footer | `src/components/fx/SiteFooter.tsx` |
| Category card, section title | `src/components/fx/CategoryCard.tsx` |
| Request wizard (one data-driven component) | `src/components/customer/ServiceFlowModal.tsx` |
| Screenshot at artboard width for comparison | `scripts/figma-compare.mjs` |

## Parity table

| # | Frame (node) | Route | Status |
| --- | --- | --- | --- |
| 1 | Homepage (565:2) | `/` | **Done**, compared with the frame at 440 px. Live categories from the database. Differences are the deliberate ones above |
| 2 | Welcome slide 1 (631:2) | `/auth/welcome` | **Done**, compared |
| 3 | Welcome slide 2 (633:178) | `/auth/welcome` | Built as slide 2 of the same carousel. Frame not read: wording is FLEXS's own |
| 4 | Welcome slide 3 (633:192) | `/auth/welcome` | Built as slide 3. Frame not read |
| 5 | Send Email (633:209) | `/auth/welcome` after the slides | Works (sends a sign-in link). Frame not read: restyled with tokens only |
| 6 | Email Send Failed (633:232) | error state of `/auth/welcome` | Works. Frame not read |
| 7 | Email To Login (633:246) | `/auth/check-email` | Works. Frame not read: tokens only |
| 8 | Login (634:553) | `/auth/login` | **Done**, compared. "Keep me signed in" is functional. The other 7 Login variants were not read |
| 9 | Loading Screen (568:26669) | loading step inside the wizard | Works. Frame not read |
| 10 | Search results 1 (568:13658) | wizard question step on `/services/:slug` | **Done**, compared at 440 px on live data. Small difference: the "Other" text field appears after choosing Other, not before |
| 11 | Search results 2–16 (568:14316 … 574:1330) | later wizard steps | Same component, driven by each category's questions. Frames not read |
| 12 | Buyer Dashboard (576:2007) | `/my-requests` | **Done**, compared with live data. Keeps filters, paging and support/notification shortcuts that the frame does not show |
| 13 | Search Page (569:2) | `/post-job` | Rebuilt on shared header, footer and category cards (two columns on phones). Frame not read |
| 14 | Categories (610:1588) | `/post-job` | Mapped to the same screen. Frame not read |
| 15 | Submit a Request (609:843, 610:988, 610:1295) | `/post-job/:slug`, `/post-job/contact`, `/post-job/success` | Works. Frames not read: tokens only |
| 16 | Category landing pages (602:53, 644:2 and about 60 more) | `/services/:slug` | Works for all 51 live categories; shared header and footer. Frames not read |
| 17 | Read Guide (609:2) | — | **Missing**: no guide content exists |
| 18 | Profile (617:824) | `/profile/:userId` | Works. Frame not read |
| 19 | business Page (617:2419) | `/pro` | Works; shared header and footer. Frame not read |
| 20 | Help (610:1383) | `/help` | Works; shared header. Frame not read |
| 21 | Contact us (609:500) | `/support` (signed-in tickets) | Works. Frame not read |
| 22 | About (610:1717) | `/about` | Works, truthful FLEXS content; shared header and footer. Frame not read |
| 23 | Affiliate (610:2211) | `/affiliates` | Works; states that no programme is running. Frame not read |
| 24 | Press (614:8) | — | **Missing**: FLEXS has no press coverage to show |
| 25 | Terms (615:123) | — | **Missing**: needs FLEXS's own legal text from the owner |
| 26 | Cookies (616:711) | `/cookies` | Works; shared header and footer. Frame not read |
| 27 | Privacy (617:430) | `/help/privacy` | Partial: explains deletion and data requests; a full policy needs the owner's legal text |
| 28 | Request wizard frames (about 250, e.g. 716:280, 716:557, 674:2, 695:530) | wizard steps | One component covers them. Frames not read; questions come from the database, not from the file |
| 29 | Desktop frames (441, 1440 px) | all routes | Not started. Current screens are responsive, not matched to the desktop frames |

## Verification after the redesign (2026-11-18)

OCR audit at phone size on the live backend: 15 public and 11 signed-in screens load with no errors, no sideways overflow and no banned wording. 92 tests, typecheck, lint, build and 29 browser scenarios pass. Android debug APK and unsigned release bundle rebuilt with the new design (not yet run on a device).

## Part 3 (2026-11-18, no new Figma reads)

- Check email, forgot password, reset password and the onboarding form steps now use the shared wordmark, 50 px fields and token radii.
- Service pages no longer show a "press" strip (CBC, Globe&Mail, Toronto Star, Maclean's): FLEXS has no such coverage. Those names are now banned wording in `scripts/ocr-screen-audit.mjs`.
- Category photos that fail to load are hidden instead of showing a broken-image icon.
- Desktop pass at 1440 px on home, post-job, login, welcome, forgot password, service page, help, about, pro: no sideways overflow, no page errors.
- Checks: typecheck, lint (0 errors), 92 tests, build, browser scenarios, OCR audit on public screens: all pass.

## Frames still needed to finish

Welcome slides 2–3, Send Email, Email Send Failed, Email To Login, the 7 other Login variants, Loading, Search Page, Categories, Submit a Request ×3, one category landing page, one multi-select wizard step, the contact-details wizard step, Profile, business Page, Help, Contact us, Cookies. Either raise the Figma limit or export these frames as PNG into the Drive coordination folder.
