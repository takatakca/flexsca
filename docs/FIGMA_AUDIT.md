# Figma audit — every frame vs. the code (2026-11-20)

Signed: Claude (scanner session, Claude in Chrome). Read-only audit of the Figma file `KW0VGNTJesMw7TyGrZkcsI` (Page 1, 894 frames), compared with `main` at 1621783 and `docs/FIGMA_PARITY.md`. No app code changed in this PR.

Read each frame with the Figma connector **one node at a time** (never `0:1`, it is too big). The text quoted below comes straight from the frames' text layers, so it is exact.

## 1. What the file contains

| Group | Phone (440 px) | Desktop (1440 px) | Status in the code |
| --- | --- | --- | --- |
| Professional app (leads, filter, settings, reminders, responses) | 7 | 0 | **Never compared.** Frames are mislabeled "Login Page ( Mobile )" (the "7 other Login variants" in the parity table) |
| Pro sign-up (landing, area, details, login) | 4 | 5 | Built in `/pro`, `/onboarding`; phone frames never compared; 695:435 and 695:530 were filed as customer wizard steps by mistake |
| Customer request wizard steps | about 300 (1165 and 1167 px high) | about 330 (1024 px high) | Step types done (PR #16). Question sets intentionally not copied |
| Category landing pages | about 75 | about 65 | Group layout done; leaf pages not read one by one |
| Core, help, legal pages | about 25 | about 25 | Mostly done on phone; desktop partly (PR #17) |
| Directory list ("Profile Page") | 617:824 | 75:3138 | Phone done (PR #14); desktop not compared |
| All services index ("Tabs", 1240 px) | — | 619:3252 | **Not built** as its own page |

## 2. Gaps, in priority order

### P1 — Professional app (FLEXS's own design: Quebec addresses, credits; copy it exactly)

These are not Bark captures. Match them one for one.

1. **Leads list, 909:1102** (`/app/leads`, `src/pages/app/Leads.tsx`, `src/components/leads/LeadCard.tsx`)
   - Top bar: back arrow, title "Leads", settings gear on the right.
   - Summary pill: pencil icon, "18 Matching leads", sub-line "2 services • 1 location", round filter button inside the pill; separate pill button "Map" (on the map view it reads "List").
   - Card: coloured round avatar with the initial, name, place line "Sainte-Sophie, QC, J5J", "Nationwide", time chip top right ("1h Ago", "17h Ago"), blue unread dot at left.
   - Badges: "High hiring Intent" (blue chip), "Urgent" (amber chip), "Verified phone" (green chip). **Missing today:** "High hiring Intent" and "Verified phone"; "Urgent" is shown as "⚡ Urgent request" text, not a chip.
   - Grey inner box: service title ("Web Design") and the answers line "Create a new website / Type: Business / Starting: ASAP".
   - Footer row: credits icon and "32 Credits"; bar icon and "1st to respond".
2. **Leads map view, 909:713 and 909:983.** **Missing today.** Full-screen map behind the summary pill, a square "expand" button under the "List" pill, lead cards in a horizontal carousel at the bottom. Use OpenStreetMap tiles. Show the lead's area only, never an exact address.
3. **Filter, 909:606** (`src/components/leads/FiltersSheet.tsx`): back arrow, "Filter", "Reset" at the right; "Filtered result: 18", "18 leads matching your lead setting"; Sort by (Recommended / Newest First); Keyword Search field; View: "Unread (17)"; **Lead Spotlights: "All Lead Spotlights (15)", "Free Leads (8)"** (missing today); full-width blue "Apply Filter".
4. **Settings, 906:2** (`src/pages/app/Settings.tsx`): back arrow and "Setting"; profile photo with star rating and count "(0)"; section "Profile" with My Profile, Reviews, **Pricing** (missing today: "Enter your pricing to improve your profile"), Account details, each with the sub-line from the frame; section "Lead Settings" below. FLEXS's extra items (services, locations, statuses, credits, support) stay, under Lead Settings.
5. **Reminders empty state, 907:443** (`src/pages/app/Reminders.tsx`): avatar top left, "Reminders", gear; round illustration; heading "Reminders"; body "Reminders that you create will show up here." (fix the frame's grammar).
6. **Responses empty state, 908:532** (`src/pages/app/Responses.tsx`): amber full-width status dropdown "Pending" with chevron; illustration; "No responses"; existing body text; blue link "View Leads".
7. **Bottom tab bar** (all four frames): Leads, Responses, Reminders, icon above label, active item dark navy, others grey. Check `src/components/AppLayout.tsx` keeps exactly these three on phones.

### P1 — Pro sign-up, phone frames

8. **682:213** "Secure jobs and grow your business" (`/pro`): sub-line "1000's of local and remote clients are already waiting for your services", service field with "GO", "What Service do you provide?", the Popular services chips. Desktop version is done (PR #17); compare the phone frame.
9. **695:435** "Where would you like to see leads from?" (`/onboarding`): "Tell us the area you cover so we can show you leads for your location"; card with "I serve customers within", distance select, "From", place field with pin, "You can change your location at any time", blue "Next". Use km, not miles.
10. **695:530 and 695:611** "Some details about you": "You're just a few steps away from viewing our {service} leads"; Your name, Company name (+ hint), Email address, Phone number (Optional), website Yes/No chips, Company size chips (Self-employed, Sole trader / 2–10 / 11–50 / 51–200 / 200+), Back and Next, Terms line. The frame's fields show the placeholder "30 miles" by mistake; use real placeholders.
11. **682:2** pro Login: Email, Password, Keep me signed in, Forgot your password?, "Or", Login with a magic link, Sign in with Apple, Login with Google.
12. Desktop: 424:2, 438:2, 438:386, 438:464, 222:3980.

### P2 — Pages not built yet

13. **All services index, 619:3252** (desktop, 1240 px): every group as a heading with its services listed under it. Build it as `/services` (no such route today, so it falls to the 404 page) from the live categories, and link "All services" in the footer to it.
14. **Terms for Professionals, 831:1370 (phone) and 819:1415 (desktop)**; Terms for Customers 615:123 / 819:1110 / 72:1751 / 819:804. Layout only. **The text must be FLEXS's own legal text from the owner.**
15. **Trust and safety help articles, 831:2735 and 831:2967**: help article layout with "In This Article" contents list, numbered sections, "Was this article helpful? Yes / No", Related articles. Use the layout for FLEXS's own chat rules and review policy articles; write FLEXS's text, don't copy Bark's.
16. **Group landing "Product", 616:1087**: same template as 617:2419; check the "Product" group renders.
17. **Directory desktop, 75:3138**: three-column card grid (name, distance, categories, description, View profile, Request quote), "View More".

### P3 — Desktop frames still to compare (after PR #17)

Search page 4:546; group landings 102:595, 102:1433; wedding landing 28:49 and guide 36:869; help 37:1525, 818:303, 818:482, 39:2642; categories 39:2435; submit a request 39:1939, 39:2105, 39:2246; your requests 25:6315; cookies 73:2590; privacy 74:2941; affiliate 62:755; press 62:1423; careers 39:2786 (not applied, another company's facts); the 17 desktop wizard steps 19:828 to 24:5974.

### P3 — Leaf category landing pages

About 75 phone and 65 desktop. Each is the same template: hero with the two fields, breadcrumb, "Need help finding a …?", intro, three steps, **Reviews** section, **Related services**, FAQ. Phone examples: 645:310 (Coding Tuition), 663:2759 (Appraisers), 648:6779 (Arbitration), 739:1804 (Auditors), 749:443 (Tax Accountants). Desktop examples: 528:7625 (Accountant), 511:1220 (SEO), 510:436 (Web Developers). Read 3 phone and 3 desktop examples, adjust the leaf template, then screenshot every live leaf category at 440 and 1440 px. Reviews show only verified FLEXS reviews; hide the section when there are none.

## 3. Things not to copy (unchanged)

The customer-facing part of the file is a capture of Bark.com. Keep leaving out Bark's name ("Welcome to Bark for professionals", "Bark Chat Guidelines"), the Trustpilot score "4.1 / 103,286 reviews", the "United Kingdom" selector, "© 2025 Taka Tak .com Global Limited", press logos, testimonials, Bark's question sets and its legal and help text. Copy layout, spacing, colours and flows.

## 4. Frame map for the groups above

- Professional app: 906:2, 909:606, 909:713, 909:983, 909:1102, 907:443, 908:532
- Pro sign-up phone: 682:213, 695:435, 695:530, 695:611, 682:2; desktop: 424:2, 438:2, 438:386, 438:464, 222:3980
- Customer sign-in phone: 631:2, 633:178, 633:192, 633:209, 633:232, 633:246, 634:553
- Request wizard phone, by category: Advertising Agencies 716:* to 770:* (1167 px), Media Buying 674:* (1024 px), others 568:*, 572:*, 673:*, 679:*, 681:*, 697:*, 699:*, 701:*, 704:*, 705:* (1165 px)
- Request wizard desktop: 19:828 to 24:5974 (home flow); 221:*, 222:*, 247:5, 248:363 and 290:* to 568:* (per category, 1024 px)
