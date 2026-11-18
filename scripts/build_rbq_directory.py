#!/usr/bin/env python3
"""Turn the RBQ open-data licence list into SQL batches for public.business_listings.

Source: Régie du bâtiment du Québec, "Liste des licences actives", Données Québec,
licence CC BY 4.0 (https://www.donneesquebec.ca/recherche/dataset/licencesactives).

Only the name, municipality, region, trade and licence number are kept. Emails, phone
numbers and street addresses in the source file are never written out; the email is
reduced to a SHA-256 so the real owner can claim the listing by signing in with it.

Usage: python3 -I scripts/build_rbq_directory.py <rbq.csv> <outDir>
Then run the batch-*.sql files in order with a service connection, then finish.sql.
"""
import csv, hashlib, json, os, re, sys, unicodedata

SPECIALISED = [  # first match wins
    ({'16'}, 'Electrical', 'electrical-work'),
    ({'15.5'}, 'Plumbing', 'plumbing'),
    ({'15.1', '15.2', '15.3', '15.4', '15.7', '15.8', '15.9', '15.10'}, 'Heating and cooling', None),
    ({'1.1.1', '1.1.2', '1.2', '1.3'}, 'General contractor', None),
]

def slugify(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')

def clean(text, limit):
    return re.sub(r'\s+', ' ', text).strip()[:limit]

def main(src, out):
    os.makedirs(out, exist_ok=True)
    licences = {}
    with open(src, encoding='utf-8-sig', newline='') as fh:
        for row in csv.DictReader(fh):
            number = row['Numéro de licence'].strip()
            entry = licences.setdefault(number, {'row': row, 'codes': set()})
            if row['Sous-catégories'].strip():
                entry['codes'].add(row['Sous-catégories'].strip())
    rows, skipped = [], {'not_contractor': 0, 'person': 0, 'public_body': 0, 'restricted': 0, 'incomplete': 0}
    for number, entry in licences.items():
        r = entry['row']
        if r['Type de licence'] != 'Entrepreneur': skipped['not_contractor'] += 1; continue
        if r['Statut juridique'] == 'Personne physique': skipped['person'] += 1; continue
        if r['Statut juridique'] == 'Autorite publique': skipped['public_body'] += 1; continue
        if r['Restriction'].strip().lower() == 'oui': skipped['restricted'] += 1; continue
        name, city = clean(r["Nom de l'intervenant"], 200), clean(r['Municipalité'], 120)
        if not name or not city or not re.fullmatch(r'[0-9-]{6,20}', number): skipped['incomplete'] += 1; continue
        trade, category = 'Construction and renovation', None
        for codes, label, slug in SPECIALISED:
            if entry['codes'] & codes: trade, category = label, slug; break
        email = r['Courriel'].strip().lower()
        rows.append({
            'source_ref': number, 'name': name, 'other_name': clean(r['Autre nom'], 200) or None, 'city': city.title() if city.isupper() else city,
            'region': clean(r['Région administrative'], 120) or None, 'trade': trade, 'category_slug': category,
            'trade_codes': sorted(c for c in entry['codes'] if re.fullmatch(r'[0-9.]{1,6}', c)),
            'slug': (slugify(name)[:90] + '-' + slugify(city)[:40] + '-' + number.replace('-', ''))[:160],
            'email_sha256': hashlib.sha256(email.encode()).hexdigest() if re.fullmatch(r'[^@\s]+@[^@\s]+\.[^@\s]+', email) else None,
        })
    size = 2000
    for i in range(0, len(rows), size):
        payload = json.dumps(rows[i:i + size], ensure_ascii=False).replace('$rbq$', '')
        with open(os.path.join(out, f'batch-{i // size:03d}.sql'), 'w', encoding='utf-8') as fh:
            fh.write(f"""WITH src AS (
  SELECT * FROM jsonb_to_recordset($rbq${payload}$rbq$::jsonb)
    AS x(source_ref text, name text, other_name text, city text, region text, trade text, category_slug text, trade_codes text[], slug text, email_sha256 text)
), up AS (
  INSERT INTO public.business_listings (source, source_ref, name, other_name, city, region, trade, category_slug, trade_codes, slug)
  SELECT 'rbq', source_ref, name, other_name, city, region, trade, category_slug, trade_codes, slug FROM src
  ON CONFLICT (source, source_ref) DO UPDATE SET name = EXCLUDED.name, other_name = EXCLUDED.other_name, city = EXCLUDED.city,
    region = EXCLUDED.region, trade = EXCLUDED.trade, category_slug = EXCLUDED.category_slug, trade_codes = EXCLUDED.trade_codes, source_synced_at = now()
  RETURNING id, source_ref, status
)
INSERT INTO public.business_listing_verifiers (listing_id, email_sha256)
SELECT up.id, src.email_sha256 FROM up JOIN src USING (source_ref) WHERE src.email_sha256 IS NOT NULL AND up.status = 'listed'
ON CONFLICT (listing_id) DO UPDATE SET email_sha256 = EXCLUDED.email_sha256;
""")
    with open(os.path.join(out, 'finish.sql'), 'w') as fh:
        # Licences that left the register stop being listed; claimed and removed rows are left alone.
        fh.write("UPDATE public.business_listings SET status = 'removed' WHERE source = 'rbq' AND status = 'listed' AND source_synced_at < now() - interval '6 hours';\n")
    print(json.dumps({'listed': len(rows), 'skipped': skipped, 'batches': (len(rows) + size - 1) // size}))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
