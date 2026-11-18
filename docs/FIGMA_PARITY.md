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
| 3 | Welcome slide 2 (633:178) | `/auth/welcome` | **Done**, read and compared: Skip, title, sub-line, three dots, Continue. FLEXS wording |
| 4 | Welcome slide 3 (633:192) | `/auth/welcome` | **Done**, read and compared |
| 5 | Send Email (633:209) | `/auth/welcome` after the slides | **Done**, read and compared: heading, hint, "Email address" field, full-width button, soft gradient at the foot. The button says "Send my sign-in link" |
| 6 | Email Send Failed (633:232) | error state of `/auth/welcome` | **Done**, read and compared: coral band across the top with the message (token `--fx-danger-banner`) |
| 7 | Email To Login (633:246) | `/auth/check-email` | **Done**, read and compared: blue back arrow, heading, address in blue, paper plane, Send another link, OR, Sign in with a password, soft gradient |
| 8 | Login (634:553) | `/auth/login` | **Done**, compared. "Keep me signed in" is functional. The other 7 Login variants were not read |
| 9 | Loading Screen (568:26669) | loading step of the wizard | **Done**, read and compared: white card, thin ring, "Please wait..." |
| 10 | Search results 1 (568:13658) | wizard question step on `/services/:slug` | **Done**, compared at 440 px on live data. Small difference: the "Other" text field appears after choosing Other, not before |
| 11 | Search results 2–16 (568:14316, 568:15103, 568:16161, 568:16549, 568:16930, 697:4606, 568:17659, 568:18035, 568:18412, 568:18782, 697:6897, 697:7205, 697:7516, 572:997, 574:1330) | wizard steps on `/services/:slug` and `/post-job/:slug` | All 15 **read**. They are: seven question steps (single choice, multiple choice, Other field, Show more), loading, location, "matches found", email, phone, name, and "Describe your request in detail" after posting. `/post-job/:slug` question card rebuilt to match (progress bar and close on one row, 22 px question, Back and Continue). **Open**: the contact steps on `/post-job/contact` are still one form, not one field per step as in the frames; the modal on `/services/:slug` already has those steps. Next: merge both into the single wizard component |
| 12 | Buyer Dashboard (576:2007) | `/my-requests` | **Done**, compared with live data. Keeps filters, paging and support/notification shortcuts that the frame does not show |
| 13 | Search Page (569:2) | `/post-job` | **Done**, read and compared at 440 px: hero with the two questions, intro, three numbered steps, call to action, Popular Categories, All services as chips by group. FLEXS wording; live categories |
| 14 | Categories (610:1588) | `/help/new`, `/help/professionals`, `/help/customers` | **Done**, read and compared. The frame is the help centre's category page (breadcrumb, three tabs, article list, Get in touch), not a service list |
| 15 | Submit a Request (609:843, 610:988, 610:1295) | `/support` | **Done**, read and compared. The frames are the help centre's support request form, not the service request: breadcrumb, "Submit a request", topic, email, subject, details, Submit. No rich-text toolbar and no attachments (tickets are plain text); credit refunds are sent from the request itself, and the form says so |
| 16 | Category landing pages (602:53, 644:2 and about 60 more) | `/services/:slug` | Group categories now use the landing layout of 617:2419 (see row 19). Leaf categories keep the existing page with the wizard. Individual frames not read one by one: same template |
| 17 | Read Guide (609:2) | — | **Missing**: no guide content exists |
| 18 | Profile (617:824) | `/directory` | **Done**, read and compared. The frame is a list of professional cards (name, distance, categories, View profile, Request quote). Built as the directory result cards in PR #14. No photo or stars for unclaimed businesses: FLEXS has none to show |
| 19 | business Page (617:2419) | `/services/:slug` for group categories (for example `/services/event-and-travel-services`) | **Done**, read and compared. The frame is the "Business" category landing page, not the professionals page: hero form, breadcrumb, intro, three steps, popular categories, every service of the group as full-width rows |
| 20 | Help (610:1383) | `/help` | **Done**, read and compared: gradient search band, three category cards, Popular list, Get in touch, call-out. No photo collage in the band (stock photos of people not used) and no phone line (FLEXS has none) |
| 21 | Contact us (609:500) | `/help/:article` | **Done**, read and compared. The frame is a help article page: breadcrumb, Articles in this section, Contact customer support (ticket, credit refund), previous and next article. `/support` stays the signed-in ticket screen |
| 22 | About (610:1717) | `/about` | Read. **Not applied**: the frame is another company's careers page (job openings, offices in six countries, staff numbers, perks, a company timeline). None of it is true of FLEXS. `/about` keeps FLEXS's own content on the shared header and footer |
| 23 | Affiliate (610:2211) | `/affiliates` | Read. **Not applied**: the frame describes a paid affiliate programme run through a third-party network with set commissions. FLEXS runs no programme; the page says so. Build it when the owner defines one |
| 24 | Press (614:8) | — | **Missing**: FLEXS has no press coverage to show |
| 25 | Terms (615:123) | — | **Missing**: needs FLEXS's own legal text from the owner |
| 26 | Cookies (616:711) | `/cookies` | **Done**, read and compared: centred title, section headings, body text. **Owner: the wording of this policy needs a legal review**; it describes analytics and advertising tools FLEXS may not use |
| 27 | Privacy (617:430) | `/help/privacy` | Partial: explains deletion and data requests; a full policy needs the owner's legal text |
| 28 | Request wizard frames (about 250, e.g. 716:280, 716:557, 674:2, 695:530) | wizard steps | Not read one by one. The 15 frames of row 11 give every step type; each category's questions come from the database (`service_categories.questions`), which is the data-driven source. Copying the other company's 250 question sets into FLEXS is not done: FLEXS questions are written per category |
| 29 | Desktop frames (441, 1440 px) | all routes | Not started. Current screens are responsive, not matched to the desktop frames |

## Verification after the redesign (2026-11-18)

OCR audit at phone size on the live backend: 15 public and 11 signed-in screens load with no errors, no sideways overflow and no banned wording. 92 tests, typecheck, lint, build and 29 browser scenarios pass. Android debug APK and unsigned release bundle rebuilt with the new design (not yet run on a device).

## Part 3 (2026-11-18, no new Figma reads)

- Check email, forgot password, reset password and the onboarding form steps now use the shared wordmark, 50 px fields and token radii.
- Service pages no longer show a "press" strip (CBC, Globe&Mail, Toronto Star, Maclean's): FLEXS has no such coverage. Those names are now banned wording in `scripts/ocr-screen-audit.mjs`.
- Category photos that fail to load are hidden instead of showing a broken-image icon.
- Desktop pass at 1440 px on home, post-job, login, welcome, forgot password, service page, help, about, pro: no sideways overflow, no page errors.
- Checks: typecheck, lint (0 errors), 92 tests, build, browser scenarios, OCR audit on public screens: all pass.

## Group A, core pages (2026-11-18, new file key `KW0VGNTJesMw7TyGrZkcsI`)

Read one frame at a time (never page 0:1 whole): 569:2, 610:1588, 617:2419, 617:824, 610:1383, 609:500, 610:1717, 610:2211, 616:711.
Several frame names do not say what the frame is: "Profile" is a list of professionals, "business Page" is a category landing page,
"Categories" and "Contact us" are help-centre pages. Routes were mapped to what each frame shows.
Checks: typecheck, lint (0 errors), 99 tests, build, 29 browser scenarios; 440 px and 1440 px screenshots without overflow.

## Groups B, C and D (2026-11-18)

Read: 633:178, 633:192, 633:209, 633:232, 633:246, 568:26669 (B); 609:843, 610:988, 610:1295 (C); the 15 search-result frames (D).
Checks after these groups: typecheck, lint (0 errors), unit tests, build, browser scenarios.

## Frames still needed to finish

Welcome slides 2–3, Send Email, Email Send Failed, Email To Login, the 7 other Login variants, Loading, Search Page, Categories, Submit a Request ×3, one category landing page, one multi-select wizard step, the contact-details wizard step, Profile, business Page, Help, Contact us, Cookies. Either raise the Figma limit or export these frames as PNG into the Drive coordination folder.
