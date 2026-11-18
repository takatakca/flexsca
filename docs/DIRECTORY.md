# Business directory (businesses listed before they sign up)

Owner's order, 2026-11-18: every Quebec business should already have a basic page on FLEXS
(name, city, trade) with no way to contact it, and be able to claim it with a 30-day free trial.

## What is live

- `public.business_listings`: 49,252 Quebec contractors imported on 2026-11-18.
- Pages: `/directory` (search by name, city, trade), `/business/:slug`, `/business/:slug/claim`.
- Admin screen: "Business claims to verify".

## Source and licence

| Source | Licence | Status |
|---|---|---|
| Régie du bâtiment du Québec, "Liste des licences actives" (Données Québec, daily) | CC BY 4.0, commercial use allowed with attribution | Imported |
| Registraire des entreprises du Québec (all enterprises) | CC BY-NC-SA 4.0, **no commercial use** | Not used. A commercial agreement with the Registraire is needed first |
| Google Maps, Yelp, Yellow Pages, 411, RestoMontréal | Proprietary, terms forbid copying | Not used |
| Ville de Montréal open data, Statistics Canada ODBus, OpenStreetMap | Open, commercial use allowed | Next candidates (restaurants, shops, services) |

The attribution line on `/directory` and on each business page is a licence condition. Keep it.

## What is stored and what is not

Stored: business name, other name, municipality, region, trade, RBQ licence number.
Never stored: phone, street address, email. The email is reduced to a SHA-256 in
`business_listing_verifiers`, which no client role can read.

Left out of the import: 4,289 licences held by individuals in their own name (the name is a
person's name; owner to decide), 993 owner-builders, 43 restricted licences.

## Claiming

1. The owner signs in and opens "Claim this business".
2. If the confirmed sign-in email is the one the business gave the RBQ, the claim is approved at once.
3. Otherwise it waits in the admin queue. The administrator calls the number on the RBQ register before approving.
4. Approval creates the provider profile, starts the trial (`directory_settings`: 30 days, 20 credits) and marks the listing claimed.

Limits: one business per account, one open claim per account, three claims per 30 days, one trial per
listing and per account for life (deleting the account does not reset it).

## Refresh

```bash
python3 -I scripts/build_rbq_directory.py rdl01_ExtractionDonneesOuvertes.csv out/
```

Run `out/batch-*.sql` in order with a service connection, then `out/finish.sql`. Claimed and removed
listings are never overwritten back to "listed".

## Removal requests

A business that asks to be removed: `select public.admin_remove_listing('<listing id>')`. It stays hidden on later imports.

## Payments and uploads hardening shipped with this work

- Stripe `charge.refunded` (full) and `charge.dispute.created` remove the credits bought; a dispute freezes the wallet until an administrator runs `admin_unfreeze_wallet`. **Add both events to the Stripe webhook endpoint.**
- Checkout: 5 sessions per hour and 15 per day per account, none for a frozen wallet; sessions expire after 30 minutes.
- `provider-media` bucket: JPEG, PNG or WebP only, 5 MB.
