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
| 8 | Login (634:553) | `/auth/login` | **Done**, compared. "Keep me signed in" is functional. The seven other frames named "Login Page ( Mobile )" are the professional app, see row 30 |
| 9 | Loading Screen (568:26669) | loading step of the wizard | **Done**, read and compared: white card, thin ring, "Please wait..." |
| 10 | Search results 1 (568:13658) | wizard question step on `/services/:slug` | **Done**, compared at 440 px on live data. Small difference: the "Other" text field appears after choosing Other, not before |
| 11 | Search results 2–16 (568:14316, 568:15103, 568:16161, 568:16549, 568:16930, 697:4606, 568:17659, 568:18035, 568:18412, 568:18782, 697:6897, 697:7205, 697:7516, 572:997, 574:1330) | wizard steps on `/services/:slug` and `/post-job/:slug` | **Done**, all 15 read and compared at 440 px. One wizard component (`ServiceFlowModal`) now serves both entry points: questions, where, loading, "nearly ready", email, phone, name, review, details. One field per step as in the frames. Differences kept on purpose: the "nearly ready" card does not claim matches were found (none are computed), no marketing-email tick box, and the detail text is asked before the request is sent, not after |
| 12 | Buyer Dashboard (576:2007) | `/my-requests` | **Done**, compared with live data. Keeps filters, paging and support/notification shortcuts that the frame does not show |
| 13 | Search Page (569:2) | `/post-job` | **Done**, read and compared at 440 px: hero with the two questions, intro, three numbered steps, call to action, Popular Categories, All services as chips by group. FLEXS wording; live categories |
| 14 | Categories (610:1588) | `/help/new`, `/help/professionals`, `/help/customers` | **Done**, read and compared. The frame is the help centre's category page (breadcrumb, three tabs, article list, Get in touch), not a service list |
| 15 | Submit a Request (609:843, 610:988, 610:1295) | `/support` | **Done**, read and compared. The frames are the help centre's support request form, not the service request: breadcrumb, "Submit a request", topic, email, subject, details, Submit. No rich-text toolbar and no attachments (tickets are plain text); credit refunds are sent from the request itself, and the form says so |
| 16 | Category landing pages (644:2 phone, 28:49 desktop, and about 60 more of the same template) | `/services/:slug` | **Done**, read and compared at 440 px and 1440 px. Single services: photo hero with the "where" question, breadcrumb, intro, three numbered steps, Popular cities, Related services, closing call-out. Popular cities shows real businesses from the directory for the first three cities when the service matches a directory trade. Removed from the old page: guide and price-guide cards that led nowhere, and a list of Ontario cities. A Reviews section shows verified reviews and stays hidden while there are none. Groups use row 19's layout |
| 17 | Read Guide (609:2) | — | **Missing**: no guide content exists |
| 18 | Profile (617:824) | `/directory` | **Done**, read and compared. The frame is a list of professional cards (name, distance, categories, View profile, Request quote). Built as the directory result cards in PR #14. No photo or stars for unclaimed businesses: FLEXS has none to show |
| 19 | business Page (617:2419) | `/services/:slug` for group categories (for example `/services/event-and-travel-services`) | **Done**, read and compared. The frame is the "Business" category landing page, not the professionals page: hero form, breadcrumb, intro, three steps, popular categories, every service of the group as full-width rows |
| 20 | Help (610:1383) | `/help` | **Done**, read and compared: gradient search band, three category cards, Popular list, Get in touch, call-out. No photo collage in the band (stock photos of people not used) and no phone line (FLEXS has none) |
| 21 | Contact us (609:500) | `/help/:article` | **Done**, read and compared. The frame is a help article page: breadcrumb, Articles in this section, Contact customer support (ticket, credit refund), previous and next article. `/support` stays the signed-in ticket screen |
| 22 | About (610:1717) | `/about` | Read. **Not applied**: the frame is another company's careers page (job openings, offices in six countries, staff numbers, perks, a company timeline). None of it is true of FLEXS. `/about` keeps FLEXS's own content on the shared header and footer |
| 23 | Affiliate (610:2211) | `/affiliates` | Read. **Not applied**: the frame describes a paid affiliate programme run through a third-party network with set commissions. FLEXS runs no programme; the page says so. Build it when the owner defines one |
| 24 | Press (614:8 phone, 62:1423 desktop) | `/press` | **Done**, read and compared: title band and how to reach the team. No press-release cards: FLEXS has published none |
| 25 | Terms (615:123 phone, 72:1751 desktop) | `/terms`, `/terms?for=professionals` | **Done**, read and compared: Customers and Professionals tabs, centred title, date, numbered sections. The text is FLEXS's own, written from how the product works. **Owner: have it reviewed by a lawyer before launch** |
| 26 | Cookies (616:711) | `/cookies` | **Done**, read and compared: centred title, section headings, body text. **Owner: the wording of this policy needs a legal review**; it describes analytics and advertising tools FLEXS may not use |
| 27 | Privacy (617:430 phone, 74:2941 desktop) | `/privacy` | **Done** in the same layout. The text describes what FLEXS really collects and who processes it (database hosted in Canada). **Owner: name the person responsible for personal information and have the text reviewed by a lawyer** |
| 28 | Request wizard frames (about 250, e.g. 716:280, 716:557, 674:2, 695:530) | wizard steps | Not read one by one. The 15 frames of row 11 give every step type; each category's questions come from the database (`service_categories.questions`), which is the data-driven source. Copying the other company's 250 question sets into FLEXS is not done: FLEXS questions are written per category |
| 29 | Desktop frames (441 frames, 158 distinct screens at 1440 px) | all routes | **Compared and adjusted:** Homepage (2:2), Help (39:2435), Help category (39:2642), Help article (37:1525), Search Page (4:546), Category landing (28:49), Professionals list (75:3138), Cookies (73:2590), Buyer Dashboard (25:6315), Submit a Request (39:1939), Search results 1 (19:828), Join as a Professional (424:2), shared header with a signed-in state. Also read: Terms (72:1751), Press (62:1423), Read Guide (36:869), articles (818:303), wizard steps 19:4424 and 24:5974 (the wizard's last step rebuilt to match). **Not built:** Read Guide and the policy articles need written content that does not exist yet. **Not read yet:** the other wizard steps at desktop size (same card), Loading (568:19137), Privacy (74:2941, built from the Terms layout), Banned Reviews Policy (818:482), About us (39:2786), affiliate (62:755), and about 130 category and flow frames that reuse these templates |
| 30 | Professional app, frames named "Login Page ( Mobile )": Leads list 909:1102, Leads map 909:713 and 909:983, Filter 909:606, Settings 906:2, Reminders empty 907:443, Responses empty 908:532 | `/app/leads`, `/app/settings`, `/app/reminders`, `/app/responses` | **Done**, read and compared at 440 px. Lead cards: unread dot, initial, town and postal area, time chip ("1h Ago"), chips, service box, credits, "1st to respond". Header pill with the count and scope, round filter button, List / Map switch. Map view on OpenStreetMap tiles with one marker per town (never an address) and the cards as a carousel. Filter: "Filtered result: N", Reset, Apply Filter. Settings: Pricing item added. Differences kept on purpose: the chip says "Phone provided" because FLEXS does not verify phone numbers; "High hiring intent" appears only when the customer's own answer says so; the tab bar keeps Overview and Updates |
| 31 | Pro sign-up: area served 695:435, details about you 695:530 and 695:611 | `/onboarding` (location and details steps) | **Done**, read and compared at 440 px: soft page, white card, shared header, "I serve customers within", radius, town field, Next; name, company, email, phone, website Yes/No, company size pills, Back and Next, terms line (now a real link) |
| 32 | Pro landing phone 682:213, Login phone 682:2 | `/pro`, `/auth/login` | Read. `/pro` follows it since PR #17. Login matches except the Apple and Google buttons, which are not shown because those sign-in methods are not set up |
| 33 | All services index 619:3252 | `/services` | **Done** from the audit's description (the frame itself does not render through the connector): every group as a heading with its services, from the live categories. Linked in the footer |
| 34 | Trust and safety articles 831:2735, 831:2967 | `/help/conversation-rules`, `/help/review-rules` | **Done**: "In this article" list and sections, FLEXS's own text. No "Was this article helpful?" counter: nothing stores the answers yet |
| 35 | Directory desktop 75:3138 | `/directory` | **Done**: three-column grid at desktop width. Identical listings (same name, town and borough) are shown once |

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

## Desktop pass 1 (2026-11-18)

- Header: section links beside the wordmark, Sign in and a blue pill for professionals on the right (frame 2:2).
- Home: 60 px headline, group headings left with "View All" on the right.
- Help centre: wider column, Popular in three columns, larger headings.
- Wizard: 700 px card and 34 px question on desktop.
- Professional page (frame 424:2): headline, service field with GO, popular services, three benefit columns with bullet points, a facts block. The frame's rating badge, daily-lead and revenue figures, customer stories and client logos are not used: FLEXS has none of them. The facts block shows two live numbers from the database (businesses listed, services).
- Checks: typecheck, lint (0 errors), unit tests, build, browser scenarios, OCR audit; 440 px and 1440 px screenshots without overflow.

## Desktop pass 2 and full screen sweep (2026-11-20)

- Category page for a single service rebuilt to frames 644:2 and 28:49 (row 16).
- Help article: two columns on desktop with the section's articles on the left; related articles.
- Search page scaled for desktop. Dashboard title row. Shared header shows the account and Sign out when signed in.
- Directory: default order ignores leading punctuation and puts numbered companies last (database column `sort_name`); towns written in capitals fixed; borough shown on cards.
- Sweep of every public route at 440 px and 1440 px (18 routes, no sideways overflow) and of the signed-in screens through the mocked scenarios (29 checkpoints). Fixed from the sweep: not-found page rebuilt with header and footer; request-submitted page no longer says professionals are being matched; customer request page has the site header; cookies page links to the privacy help page; group heading grammar.
- Checks: typecheck, lint (0 errors), 102 tests, build, 29 browser scenarios, OCR audit.

## BRIEF 5 (2026-11-21)

Frames opened one at a time: 908:532, 682:213, 438:2, 438:386, 438:464, 222:3980, 831:1370, 819:1415, 102:595, 102:1433, 39:2435, 39:1939, 39:2105, 39:2246, 73:2590, 74:2941, 36:869, 818:303, 818:482, 39:2642, 19:828, 24:5974.

| Frame | Route | Result |
| --- | --- | --- |
| Responses, empty (908:532) | `/app/responses` | **Changed.** Full-width amber status bar under the title, dark label, 8 px corners. The list it opens is headed Pending, Hired, Archived. Empty state: larger heading and text, blue "View Leads" link |
| Professional page at 440 px (682:213) | `/pro` | **Compared, no change.** The frame only draws the headline, service field with GO and the popular services; the rest of the frame is blank. FLEXS has all three, with its own headline |
| Pro sign-up, area (438:2) | `/onboarding` | **Changed.** On desktop: 940 px card, distance and town side by side with "From" between, hint on the left and Next on the right, 32 px heading. Kilometres and postal code, not miles and postcode |
| Pro sign-up, details (438:386, 438:464) | `/onboarding` | **Changed.** On desktop: 940 px card, 58 px fields, larger labels and choice pills. The two frames are identical |
| Login (222:3980) | `/auth/login` | **Changed.** On desktop: 565 px bordered card, 60 px heading, icon in front of each field, key icon in the button, blue outlined sign-in-link button. Apple and Google stay hidden until enabled |
| Terms for Professionals (831:1370, 819:1415) | `/terms?for=professionals` | **Changed.** Own layout: grey band with two tabs, 60 px centred title, date, About us, a Definitions section drawn as two grey cells per row, numbered sections in a 1,290 px column. **The text is a FLEXS draft and the page says so in a notice**; none of the frame's legal text is used. Awaiting the owner's text |
| Group landing pages (102:595, 102:1433) | `/services/<group>` | **Compared, one fix.** Hero with the two fields, breadcrumb, introduction, three steps, Popular Categories, All services were already in place. Fixed: the service chips were stretched to full width |
| Help centre home (39:2435) | `/help` | **Compared, no change** |
| Submit a request, three states (39:1939, 39:2105, 39:2246) | `/support` | **Compared, no change.** Signed-in page, checked through the browser scenarios. The frame's rich-text toolbar and file attachment are not built: support tickets take plain text |
| Cookies (73:2590) | `/cookies` | **Compared, no change** |
| Privacy notice (74:2941) | `/privacy` | **Changed.** Same wide column and type sizes as the frame on desktop. FLEXS text |
| Service guide (36:869) | none | **Not built.** A long editorial article with an author. FLEXS has no such articles; needs content from the owner |
| Trust and safety articles (818:303, 818:482) | `/help/conversation-rules`, `/help/review-rules` | **Compared, no change.** Built in the previous pull request. No "found this helpful" counter |
| Help category (39:2642) | `/help/<group>` | **Changed.** On desktop: categories in a left column with a rule, the articles on the right |
| Wizard on desktop (19:828 … 24:5974) | `/post-job/<service>` | **Compared, no change.** Card over a dimmed page, photo strip, progress bar, bordered choice list, Continue on the right, final details step. Only the first and last frames of the range were opened: the node numbers in between are not known without reading the whole page, which is not allowed |

Checks: typecheck, lint (0 errors), 103 tests, build, 29 browser scenarios, screen audit; changed pages at 440 px and 1440 px without sideways overflow.

## What is actually left

1. **Owner's text for Terms for Professionals.** The layout is ready; the wording is a draft with a visible notice.
2. **Service guides (36:869).** Needs real articles; nothing to build until they exist.
3. **Desktop wizard steps between 19:828 and 24:5974.** Send the node numbers of the middle frames and they will be compared one by one.
4. **Signed-in desktop screens.** The professional app is designed at 440 px only; on desktop it uses the same layout, centred.
5. **Frames deliberately not followed:** press logos, review-site score, testimonials, daily-lead and revenue figures, Apple and Google sign-in, "found this helpful" counts, Free Leads count, the frame's legal text.
