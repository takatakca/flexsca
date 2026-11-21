# FLEXS go-live checklist (owner)

State on 2026-11-21: **the website is online at https://flexs.ca** and passes the live check. The request wizard works end to end on the live site. The items below are settings only the owner can make. Each takes a few minutes. Never paste a key in a chat or a document: put it straight into the page named here.

Supabase project: **ALKAO** (`ysghtkallwuoodwqgkjm`). Function secrets live under **Edge Functions › Secrets**.

## 1. Payments (credits cannot be bought until this is done)

Stripe account connected: **takatak.ca**, live mode. It has no FLEXS webhook yet.

1. Stripe › **Developers › API keys**: copy the secret key (or create a restricted key with write access to Checkout Sessions and read access to Charges and Disputes).
2. Supabase › Edge Functions › Secrets: add `STRIPE_SECRET_KEY` with that value.
3. Stripe › **Developers › Webhooks › Add endpoint**:
   - URL: `https://ysghtkallwuoodwqgkjm.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`
4. Open the new endpoint, reveal its **signing secret**, and add it in Supabase as `STRIPE_WEBHOOK_SECRET`.
5. Test: sign in on flexs.ca as a professional, open **Credits and billing**, buy the smallest pack, and check that the balance goes up.

Note: the Stripe account has a second webhook whose address is a Coolify settings page (`coolify.takatak.ca/project/…/environment-variables`). It cannot work and looks like a paste mistake; delete it.

## 2. Sign-up email (only 2 emails per hour go out today)

1. Choose a mail service (the one already used for TAKATAK is fine) and get its SMTP host, port, user and password.
2. Supabase › **Authentication › Emails › SMTP Settings**: turn on custom SMTP, fill the four values, sender `no-reply@flexs.ca`, name `FLEXS`.
3. Supabase › **Authentication › Rate limits**: raise "emails sent" from 2 to at least 100 per hour.
4. Test: on flexs.ca choose **Sign in**, enter a new address, and check that the link arrives and opens flexs.ca.

## 3. First administrator (nobody can approve a business claim today)

1. Sign up on flexs.ca with the owner's email and confirm it.
2. Tell Claude which email it is. Claude adds it to `platform_admins` (one database row). No key is needed.

## 4. Sign-up hardening (these settings are shared with the ticketing site)

Supabase › **Authentication › Sign In / Providers › Email** and **Attack Protection**:

- minimum password length: 8 or more (today 6);
- leaked-password protection: on (today off);
- captcha on sign-up: on, with Cloudflare Turnstile (today off). The site needs a small code change for this; tell Claude before turning it on.

## 5. Assistant and TAKATAK link (optional for launch)

- Supabase secret `ANTHROPIC_API_KEY`: turns on the drafting assistant for professionals.
- TAKATAK tokens: see `docs/DEPLOYMENT.md`.

## 6. Keep the site up to date

Merge the launch pull request, then in GitHub **Settings › Secrets and variables › Actions** add `MOCHAHOST_FTP_SERVER`, `MOCHAHOST_FTP_USERNAME`, `MOCHAHOST_FTP_PASSWORD`. From then on every merge to `main` updates flexs.ca, and a check of the live site runs every morning.

## Decisions still open

- **French version.** The site is in English only. Quebec's Charter of the French language requires a commercial website serving Quebec customers to be available in French. This is the largest remaining piece of work.
- Final wording of the professionals' terms (`/terms?for=professionals`, marked as a draft).
- Apple and Google developer accounts for the store apps; a Mac for the iOS build.
