

# FLEX'S — Flexible Service App

A Bark for Professionals clone, mobile-first web app for service professionals to receive and respond to customer leads.

---

## 1. Authentication Flow

### Welcome Screen (`/auth/welcome`)
- Large heading: "Welcome to FLEX'S for professionals" with a professional emoji
- Subtitle: "Enter your email to start looking for your next job!"
- Email input field with mail icon
- Blue "Let's go!" primary button
- Clean white background matching Bark's style

### Check Email Screen (`/auth/check-email`)
- Heading: "You already have an account with FLEX'S, check your email to login"
- User's email displayed in blue
- Paper airplane illustration/icon
- "Not received the link?" text with blue "Send another link" button
- "OR" divider
- "Sign in with a password" secondary option (functional — opens a password input)

### Magic Link Callback (`/auth/callback`)
- Handles the magic link token from email
- If first-time user → routes to onboarding
- If returning user → routes straight to the Leads tab

---

## 2. Onboarding Carousel (3 slides)

Each slide has: the "Welcome to FLEX'S for professionals" heading at top, a centered illustration/icon, a bold feature title, descriptive text, dot indicators, Skip (top-right), and a Continue button at the bottom.

- **Slide 1** — 🔔 Bell icon — "Never miss a lead" — "Receive instant notifications for all your leads, so you never miss potential new customers."
- **Slide 2** — ✅ Checkmark icon — "Respond in seconds" — "Be the first to contact new leads with one-tap responses."
- **Slide 3** — ✏️ Pencil/quote icon — "Send quotes on the move" — "Win more work by sending accurate estimates quicker."

After the final slide, a notification permission prompt step guides the user, then routes to the main app.

---

## 3. Main App Shell

### Bottom Tab Navigation
- **Leads** — list icon
- **Responses** — chat/message icon  
- **Reminders** — bell icon

### Top Bar
- Profile avatar icon (left)
- Page title centered (e.g., "Leads")
- Settings gear icon (right) → links to `/app/settings`

---

## 4. Leads Screen (`/app/leads`)

- Shows a loading spinner with "Loading leads…" text on initial fetch
- After loading, displays a scrollable list of lead cards
- Each lead card shows: service category, location, brief details, timestamp, and status badge
- Tapping a card opens the **Lead Detail** page (`/app/leads/:id`)

### Lead Detail Page
- Full lead information: customer name, category, location, details
- Message thread showing conversation history
- "Send response" input/button to reply to the lead
- Status indicator (new / contacted / won / lost)

---

## 5. Responses Screen (`/app/responses`)

- Shows all lead messages grouped by lead
- Quick-view of recent conversations
- Tap to jump to the full lead detail and continue the conversation

---

## 6. Reminders Screen (`/app/reminders`)

- List of upcoming and past reminders tied to leads
- Each reminder shows: lead reference, note, scheduled time, status (open/done)
- Ability to create a new reminder from this screen or from a lead detail page
- Mark reminders as done

---

## 7. Settings Screen (`/app/settings`)

- Profile section (display name, email)
- Notification preferences
- Service categories management (flexible — user can add/edit their categories)
- Account section
- Logout button

---

## 8. Backend (Supabase / Lovable Cloud)

### Authentication
- Magic link email login via Supabase Auth
- Password-based login as a secondary option
- Session management with auth state listener

### Database Tables
- **profiles** — user profile data (display name, email, created_at)
- **leads** — service leads with category, location, customer info, details, status, assigned professional
- **lead_messages** — conversation messages between professional and customer/system
- **reminders** — scheduled reminders tied to leads with notes and status

### Security
- Row-Level Security on all tables so each user only sees their own data
- Profiles linked to auth.users with cascade delete

### Sample Data
- 5–10 seeded sample leads across various flexible categories so the app feels populated immediately

---

## 9. Design Style

- **Mobile-first** layout optimized for phone screens
- Clean white background with light grey sections
- Blue primary buttons (matching Bark's blue)
- Bold, large headings
- Rounded cards for lead items
- Smooth transitions between onboarding slides
- Consistent spacing and typography throughout

