# FLEXS go-live checklist (owner)

State on 2026-11-21: **the website is online at https://flexs.ca** and passes the live check. The request wizard works end to end on the live site. The items below are settings only the owner can make. Each takes a few minutes. Never paste a key in a chat or a document: put it straight into the page named here.

Supabase project: **ALKAO** (`ysghtkallwuoodwqgkjm`). Function secrets live under **Edge Functions › Secrets**.

## 1. Payments (credits cannot be bought until this is done)

Stripe account connected: **takatak.ca**, live mode. It has no FLEXS webhook yet. The Stripe connection Claude has is read-only, so the webhook below must be added by the owner.

1. Stripe › **Developers › API keys**: copy the secret key (or create a restricted key with write access to Checkout Sessions and read access to Charges and Disputes).
2. Supabase › Edge Functions › Secrets: add `STRIPE_SECRET_KEY` with that value.
3. Stripe › **Developers › Webhooks › Add endpoint**:
   - URL: `https://ysghtkallwuoodwqgkjm.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`
4. Open the new endpoint, reveal its **signing secret**, and add it in Supabase as `STRIPE_WEBHOOK_SECRET`.
5. Test: sign in on flexs.ca as a professional, open **Credits and billing**, buy the smallest pack, and check that the balance goes up.

Note: the Stripe account has a second webhook whose address is a Coolify settings page (`coolify.takatak.ca/project/…/environment-variables`). It cannot work and looks like a paste mistake; delete it.

## 2. Sign-up email (only 2 emails per hour go out today)

1. Mail service chosen (2026-11-27): a `no-reply@flexs.ca` mailbox in MochaHost cPanel, port 465. Steps: `docs/auth-emails/README.md` section 7.
2. Supabase › **Authentication › Emails › SMTP Settings**: turn on custom SMTP, fill the four values, sender `no-reply@flexs.ca`, name `FLEXS`.
3. Supabase › **Authentication › Rate limits**: raise "emails sent" from 2 to at least 100 per hour.
4. Test: on flexs.ca choose **Sign in**, enter a new address, and check that the link arrives and opens flexs.ca.

## 2b. Notification emails (new request, quote, updates)

Built and live in the database; nothing is sent until the SMTP secrets exist. By the owner's rule these emails go through **SMTP only** (no third-party mail API). They do not use Supabase's sign-in mailer settings, so the same SMTP account is entered a second time, as function secrets:

Supabase › Edge Functions › Secrets:

| Name | Value |
| --- | --- |
| `SMTP_HOST` | the mail server, for example `mail.flexs.ca` |
| `SMTP_USER` | usually `no-reply@flexs.ca` |
| `SMTP_PASSWORD` | its password |
| `SMTP_PORT` | optional; `465` by default. **Not 587 or 25**: Supabase functions cannot reach those two ports. Use 465, or 2525 if the mail service offers it |
| `EMAIL_FROM` | optional; `FLEXS <no-reply@flexs.ca>` by default |

The DNS records of `docs/auth-emails/README.md` (SPF, DKIM, DMARC) serve both kinds of email.

What is sent, each in French then English: confirmation to the customer when a request is posted; an alert to professionals whose listed service matches; a note to the customer when a quote arrives; a copy of each in-app notice. No customer contact detail or message text is ever in an email. Each person can turn the emails off in Settings.

## 3. First administrator — prepared

`takatak.ca@gmail.com` is invited. Sign up on flexs.ca with that address and confirm it: the account becomes administrator at that first sign-in, and **Administration** shows the owner overview (revenue, credits, requests, accounts, directory, claims, tickets, calls). Nothing else to do.

## 4. Sign-up hardening — done on 2026-11-21

Minimum password length is 8 and leaked-password protection is on (both also apply to the ticketing site, which shares the sign-in system). Still open: captcha on sign-up (Cloudflare Turnstile); it needs a site key from the owner and a small code change.

## 5. Assistant and TAKATAK link (optional for launch)

- Supabase secret `ANTHROPIC_API_KEY`: turns on the drafting assistant for professionals.
- TAKATAK tokens: see `docs/DEPLOYMENT.md`.

## 5b. Calls between professionals and customers (MIMT / Twilio)

The feature is built and deployed but stays hidden until three Supabase secrets exist: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (the MIMT line, a Canadian or US number in the form +15145550100). Once they are set, an unlocked request shows **Call through FLEXS**: the service rings the professional first, then connects the customer, who sees the FLEXS number. Only Canadian and US numbers are called, premium numbers are refused, a call lasts 30 minutes at most, nothing is recorded, and each professional is limited to 3 calls per customer per hour and 40 per day. Twilio bills each call to the account that owns the keys.

## 6. Hosting: one setting in Coolify

Since 2026-11-26 flexs.ca is served by Coolify (nginx) and updates by itself a few minutes after each merge to `main`. It currently uses Coolify's default static setup, so the site has **no security headers**, a missing file answers as if it existed, the hidden `.htaccess` is readable, and the sitemap does not list the business pages.

Since 2026-11-26 the build also writes the content security policy into the page itself and the site refuses to render inside another site's frame, so those two protections work with Coolify's default setup too. The Dockerfile is still needed for the rest: strict transport security, no content sniffing, real 404s for missing files and the full business sitemap.

Fix, once: in Coolify open the FLEXS application › **General** › **Build Pack** and choose **Dockerfile** (Dockerfile location `/Dockerfile`, port `80`, health check path `/healthz`), then **Deploy**. The repository's `Dockerfile` and `deploy/nginx.conf` then apply: security headers and content security policy on every response, real 404s, hidden files blocked, long caching for build files, and all business pages in the sitemap.

`npm run check:live` (and the daily **Live site check** in GitHub) fails on the "host" line until this is done, and passes after.

The Apache files (`deploy/apache.htaccess` (copied to `dist/.htaccess` by the FTP workflow only), the FTP deploy workflow) remain for an Apache host and are not used by Coolify.

## Decisions still open

- **French version: built.** The site opens in French for French browsers and has a language switch. The French text was written by Claude and should be read once by a French speaker, the legal pages above all: the French Terms of Use and Privacy Policy are translations of the owner's English text and have not been reviewed by a lawyer. The sign-in emails sent by Supabase are still in English (shared with the ticketing site).
- Final wording of the professionals' terms (`/terms?for=professionals`, marked as a draft).
- Apple and Google developer accounts for the store apps; a Mac for the iOS build.

## How the backend was verified without real keys

Three scripts play the whole journey on the real database inside a transaction that is always rolled back (they end with an error that carries the result; nothing is left behind). Paste one into the Supabase SQL editor to replay it.

- `scripts/live-journey-check.sql`: sign-up (profile and 20 credits), request, contact hidden until unlocked, unlock charged once, quote, call authorised, acceptance, review, emails queued.
- `scripts/live-claim-check.sql`: claiming a listing, self-approval refused, administrator approval, 30-day trial and 20 credits.
- `scripts/live-payment-check.sql`: what the Stripe webhook does: paid purchase credited once, replay ignored, wrong amounts refused, refund removes credits, dispute freezes the wallet.

Last run on 2026-11-21: every line true. What these cannot prove: that Stripe, the mail service and the phone service accept the keys. Each needs one real test after its key is entered (steps 1, 2, 2b and 5b).

## Errors on the live site

A screen that fails shows a recovery page, and the failure appears under **Administration › Errors on the site** (message, page, count; no personal data).
