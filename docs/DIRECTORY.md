# Business directory (businesses listed before they sign up)

Owner's order, 2026-11-18: every Quebec business should already have a basic page on FLEXS
(name, city, trade) with no way to contact it, and be able to claim it with a 30-day free trial.

## What is live

- `public.business_listings`: 153,272 businesses listed in 1,876 municipalities on 2026-11-20 (155,637 imported; 2,365 identical name, town and borough repeats are hidden, migration 20261120110000). Sources: contractors (RBQ), OpenStreetMap, tourism (SIT Québec), Montréal street-level businesses and food establishments, OPC permit holders. Default order uses `sort_name` (migration 20261120100000).
- Pages: `/directory` (search by name, city, trade), `/business/:slug`, `/business/:slug/claim`.
- Admin screen: "Business claims to verify".

## Source and licence

| Source | Licence | Status |
|---|---|---|
| Régie du bâtiment du Québec, "Liste des licences actives" (Données Québec, daily) | CC BY 4.0, commercial use allowed with attribution | Imported (`rbq`) |
| Ville de Montréal, "Établissements alimentaires" (weekly) | CC BY 4.0 | Imported (`mtl_food`), open establishments only |
| Office de la protection du consommateur, "Liste des permis et des exemptions en vigueur" (daily) | CC BY 4.0 | Imported (`opc`): vehicle dealers and recyclers, health studios, travel agents. Permits in a person's own name are left out |
| Ministère du Tourisme, SIT Québec (13 files, daily) | CC BY 4.0 | Imported (`sit`): hotels, B&Bs, campgrounds, outfitters, restaurants, attractions, producers, transport. Parks, trails, beaches, monuments, info offices left out. The 13,751 chalets and tourist homes were added on the owner's decision (2026-11-18) under the trade "Chalets and tourist homes" |
| Ville de Montréal, "Locaux commerciaux et statuts d'occupation" 2025 (annual) | CC BY 4.0 | Imported (`mtl_shops`) |
| Entreprendre Sherbrooke, "Répertoire des locaux et entreprises du territoire de Sherbrooke" (Données Québec, every two years; file of 2024-10-21) | CC0 1.0, public domain: commercial use allowed, no condition (credited anyway) | Loaded (`shb`) on 2026-11-26: 2,470 businesses new to the directory, 375 already listed under the same name skipped. Shown since 2026-11-26 17:22 UTC |
| Registraire des entreprises du Québec (all enterprises) | CC BY-NC-SA 4.0, **no commercial use** | Not used. A commercial agreement with the Registraire is needed first |
| Google Maps, Yelp, Yellow Pages, 411, RestoMontréal | Proprietary, terms forbid copying | Not used |
| OpenStreetMap, Quebec extract | ODbL 1.0: commercial use allowed; credit "© OpenStreetMap contributors"; the `osm` rows must be shareable under ODbL on request | Imported (`osm`), every category, town found from the map position. Owner accepted the conditions on 2026-11-18. Undo: `update business_listings set status='removed' where source='osm' and status='listed'` |
| Statistics Canada ODBus (2022, stale), other cities' open data (Québec, Laval, Longueuil, Gatineau) | Open, commercial use allowed (check each) | Next candidates |
| Google Places API, Google Business Profile API | Licensed API | Allowed use: keep the Google place ID and show Google details live with attribution; let an owner connect their own profile when claiming. Not allowed: storing Google's list |

The attribution line on `/directory` and on each business page is a licence condition. Keep it.

## What is stored and what is not

Stored: business name, other name, municipality, region, trade, RBQ licence number.
Never stored: phone, street address, email. The email is reduced to a SHA-256 in
`business_listing_verifiers`, which no client role can read.

Left out of the import: 993 owner-builders, 46 restricted licences, and 4,306 licences held by individuals:
the owner asked to list them (2026-11-18), but the open file blanks their names, so there is nothing to show.

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

Province-wide (OPC and SIT Québec; put `opc.csv` and the `sit-quebec-*.csv` files, renamed `sit-*.csv`, in one folder):

```bash
python3 -I scripts/build_quebec_open_directory.py data/ out/
```

A business already listed under the same name and city from another source is not listed twice.

OpenStreetMap (needs `pip install osmium shapely`, about 1.2 GB download, 15 GB RAM is plenty):

```bash
python3 scripts/build_osm_directory.py quebec-latest.osm.pbf out/
```

Sherbrooke (kept: name and kind of business; never read: address, phone, postal code, NEQ, map position; left out: vacant spaces, public bodies, schools, daycares, community and religious organisations, banks, manufacturers, wholesalers, practices listed under a person's title):

```bash
python3 -I scripts/build_sherbrooke_directory.py liste_occupants.csv out/
python3 -I scripts/test_sherbrooke_directory.py
```

RBQ:

```bash
python3 -I scripts/build_rbq_directory.py rdl01_ExtractionDonneesOuvertes.csv out/
```

Run `out/batch-*.sql` in order with a service connection, then `out/finish.sql`. Claimed and removed
listings are never overwritten back to "listed".

## Adding a source: order matters

Learned on 2026-11-26: rows from a source the live website did not know crashed their business page for a few minutes. Order to follow:

1. Ship the code first (source added to `SOURCES` in `src/lib/directory.ts`, French strings) and confirm it is live. Since 2026-11-26 an unknown source falls back to a neutral credit instead of crashing.
2. Then widen the source check (migration) and run the batches.
3. Done for Sherbrooke on 2026-11-26 once PR #31 was live, with: `UPDATE public.business_listings SET status = 'listed', source_synced_at = now() WHERE source = 'shb' AND status = 'removed';` (no Sherbrooke business has asked to be removed), then check one page and rebuild the sitemaps.

## Removal requests

A business that asks to be removed: `select public.admin_remove_listing('<listing id>')`. It stays hidden on later imports.

## Payments and uploads hardening shipped with this work

- Stripe `charge.refunded` (full) and `charge.dispute.created` remove the credits bought; a dispute freezes the wallet until an administrator runs `admin_unfreeze_wallet`. **Add both events to the Stripe webhook endpoint.**
- Checkout: 5 sessions per hour and 15 per day per account, none for a frozen wallet; sessions expire after 30 minutes.
- `provider-media` bucket: JPEG, PNG or WebP only, 5 MB.
