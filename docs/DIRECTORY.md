# Business directory (businesses listed before they sign up)

Owner's order, 2026-11-18: every Quebec business should already have a basic page on FLEXS
(name, city, trade) with no way to contact it, and be able to claim it with a 30-day free trial.

## What is live

- `public.business_listings`: 81,297 businesses on 2026-11-18: 49,252 Quebec contractors (RBQ), 11,449 Montréal food establishments, 20,596 Montréal street-level businesses.
- Pages: `/directory` (search by name, city, trade), `/business/:slug`, `/business/:slug/claim`.
- Admin screen: "Business claims to verify".

## Source and licence

| Source | Licence | Status |
|---|---|---|
| Régie du bâtiment du Québec, "Liste des licences actives" (Données Québec, daily) | CC BY 4.0, commercial use allowed with attribution | Imported (`rbq`) |
| Ville de Montréal, "Établissements alimentaires" (weekly) | CC BY 4.0 | Imported (`mtl_food`), open establishments only |
| Ville de Montréal, "Locaux commerciaux et statuts d'occupation" 2025 (annual) | CC BY 4.0 | Imported (`mtl_shops`) |
| Registraire des entreprises du Québec (all enterprises) | CC BY-NC-SA 4.0, **no commercial use** | Not used. A commercial agreement with the Registraire is needed first |
| Google Maps, Yelp, Yellow Pages, 411, RestoMontréal | Proprietary, terms forbid copying | Not used |
| Statistics Canada ODBus, OpenStreetMap, other cities' open data (Québec, Laval, Longueuil, Gatineau, Sherbrooke) | Open, commercial use allowed (check each) | Next candidates |
| Google Places API, Google Business Profile API | Licensed API | Allowed use: keep the Google place ID and show Google details live with attribution; let an owner connect their own profile when claiming. Not allowed: storing Google's list |

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

Montréal (the download link redirects to `montreal-prod.storage.googleapis.com`):

```bash
python3 -I scripts/build_montreal_directory.py businesses.csv occupation-commerciale-2025.csv out/
```

Left out of the Montréal import: closed establishments, home kitchens, daycares, schools, hospitals, residences, food banks, wholesalers, vending machines, vacant spaces, religious and public bodies, bank branches. The same business in both files is listed once. Montréal listings carry no ownership proof, so their claims always go to an administrator.

RBQ:

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
