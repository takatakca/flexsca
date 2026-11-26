#!/usr/bin/env python3
"""Turn Entreprendre Sherbrooke's open directory into SQL batches for public.business_listings.

Source: "Répertoire des locaux et entreprises du territoire de Sherbrooke" (liste_occupants.csv),
published by Entreprendre Sherbrooke on Données Québec under CC0 1.0 (public domain):
https://www.donneesquebec.ca/recherche/dataset/repertoire-des-entreprises

Only the business name, the kind of business and the source's record number are kept. The file
also holds street addresses, phone numbers, postal codes, NEQ numbers and map positions: none of
them is read into a listing.

Usage: python3 -I scripts/build_sherbrooke_directory.py <liste_occupants.csv> <outDir>
Then run the batch-*.sql files with a service connection, then finish.sql.
"""
import csv, json, os, re, sys, unicodedata

BY_USE2 = {
    'Restauration': 'Restaurant', 'Débits de boissons alcoolisées': 'Bar', 'Alimentation': 'Grocery and food shop',
    'Hôtellerie': 'Hotel and venue', 'Camping': 'Camping and outfitters',
    'Diffusion culturelle': 'Arts and culture', "Industrie de l'information, des arts et de la culture": 'Arts and culture',
    'Installations sportives et de loisirs': 'Fitness and leisure',
    'Pharmacies': 'Health and wellness', 'Professionnels de la santé et assistance sociale': 'Health and wellness',
    'Produits de santé et de beauté': 'Beauty and personal care', 'Soins personnels': 'Beauty and personal care',
    'Entretien automobile': 'Auto services', 'Vente de véhicule': 'Auto services', 'Remorquage': 'Auto services',
    'Entretien des tissus': 'Home and repair services', 'Réparation': 'Home and repair services', 'Location': 'Home and repair services',
    'Déménagement': 'Home and repair services', "Services d'entretien d'immeuble": 'Home and repair services', 'Entretien': 'Home and repair services',
    'Piscines, spas et cabanons': 'Home and repair services',
    'Construction': 'Construction and renovation',
    'Cultures': 'Farm and local products', 'Autres services agricoles': 'Farm and local products',
    'Livraison': 'Transport', 'Transport de marchandises': 'Transport', 'Transport de personnes': 'Transport', 'Autres transports': 'Transport',
}
BY_USE1 = {
    'Biens courants': 'Retail shop', 'Biens semi-courants': 'Retail shop', 'Biens réfléchis': 'Retail shop',
    'Services professionnels': 'Professional services', "Services d'affaires": 'Professional services',
    'Services aux consommateurs': 'Other services', 'Autres': 'Other services',
}
BY_USE3 = {'Agences de voyage': 'Travel agency', 'Traiteurs': 'Caterer', 'Boulangeries-pâtisseries': 'Bakery and café'}
# Not businesses a customer can hire or visit as a shop: left out, like in the Montréal import.
SKIP_USE1 = {'VACANT', 'NON-CLASSÉS', 'Organismes publics et privés', "Services d'enseignement", 'Utilité public',
             'Fabrication', 'Commerce de gros', 'Extraction'}
SKIP_USE2 = {'Centre de la petite enfance (CPE) et garderie', 'Banques, caisses populaires, prêts hypotécaires et assurances',
             'Sièges sociaux', 'Recherche et développement'}
SKIP_TYPE = {'Résidentiel', 'Institution', 'Lieu public'}
SKIP_NAME = re.compile(r'^(vacant|n/?a|nd|inconnu|ville de sherbrooke|gouvernement du (québec|canada))$', re.I)
# A practice listed under a person's title (Dr, Me, Mme): left out, like permits in a person's own name elsewhere.
PERSON = re.compile(r'^(dre?|me|mr|mme|m|mlle)\.? ', re.I)
SMALL = {'de', 'du', 'la', 'le', 'les', 'des', 'et', 'au', 'aux', 'en', 'chez', 'sur', 'the', 'and', 'of'}
# Short everyday words that are not acronyms: written as words, not capitals.
PLAIN = {'bar', 'rue', 'un', 'une', 'art', 'arts', 'ski', 'spa', 'pub', 'bio', 'inc', 'inc.', 'ltd', 'ltd.', 'vie', 'mon', 'ma', 'nos', 'pro', 'zen',
         'thé', 'roi', 'bon', 'bel', 'air', 'eau', 'mer', 'sol', 'sud', 'est', 'or', 'gym', 'lab', 'vin', 'pur', 'ici', 'max', 'top', 'duo', 'ami', 'âme',
         'île', 'enr.', 'enr', 'cie', 'par', 'ass.', 'co', 'eco', 'bus', 'fil', 'soi', 'lui', 'pas', 'wok', 'mag', 'lac', 'roc', 'sec', 'net', 'été', 'jeu', 'bec', 'fin', 'feu', 'toi', 'moi', 'bal', 'sac', 'riz', 'jus', 'mode', 'auto', 'club', 'café', 'four', 'lave', 'tech', 'plus'}
CITY, REGION = 'Sherbrooke', 'Estrie'

def slugify(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')

def clean(text, limit):
    return re.sub(r'\s+', ' ', text or '').strip()[:limit]

def tidy_name(name):
    """Source names are capitals. Keep short acronyms, calm the rest."""
    name = clean(name, 200)
    if not name.isupper(): return name
    words = []
    for i, word in enumerate(name.split(' ')):
        low = word.lower()
        if i and low in SMALL: words.append(low)
        elif low in PLAIN: words.append(low[0].upper() + low[1:])
        elif len(re.sub(r'[^A-Za-zÀ-ÿ]', '', word)) <= 3 and low not in SMALL: words.append(word)
        else: words.append(re.sub(r"(^|[-'’/&(.])([a-zà-ÿ])", lambda m: m.group(1) + m.group(2).upper(), low))
    return ' '.join(words)

def build(rows_in):
    rows, seen = [], set()
    skipped = {'vacant_or_excluded': 0, 'incomplete': 0, 'duplicate': 0}
    for r in rows_in:
        if r['usage_1'] in SKIP_USE1 or r['usage_2'] in SKIP_USE2 or r['type_etablissement'] in SKIP_TYPE or SKIP_NAME.match(clean(r['entreprise'], 200)) or PERSON.match(clean(r['entreprise'], 200)):
            skipped['vacant_or_excluded'] += 1; continue
        trade = BY_USE3.get(r['usage_3']) or BY_USE2.get(r['usage_2']) or BY_USE1.get(r['usage_1'])
        name = tidy_name(r['entreprise'])
        ref = re.sub(r'[^0-9a-f-]', '', r['id'].lower())[:40]
        if not trade or len(name) < 2 or not re.fullmatch(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', ref):
            skipped['incomplete'] += 1; continue
        # One listing per name: branches without an address cannot be told apart on the page.
        key = slugify(name)
        if key in seen: skipped['duplicate'] += 1; continue
        seen.add(key)
        activity = clean(r['usage_3'] if r['usage_3'] not in ('', 'NA') else r['usage_2'], 120)
        slug = (slugify(name)[:90] + '-sherbrooke-e' + ref.replace('-', '')[:14])[:160]
        if not re.fullmatch(r'[a-z0-9-]{3,160}', slug): skipped['incomplete'] += 1; continue
        rows.append({'source': 'shb', 'source_ref': ref, 'name': name, 'city': CITY, 'region': REGION, 'trade': trade, 'activity': activity, 'slug': slug})
    return rows, skipped

def main(source_csv, out):
    os.makedirs(out, exist_ok=True)
    with open(source_csv, encoding='utf-8-sig', newline='') as fh:
        rows, skipped = build(csv.DictReader(fh))
    size = 2500
    for i in range(0, len(rows), size):
        payload = json.dumps(rows[i:i + size], ensure_ascii=False).replace('$shb$', '')
        with open(os.path.join(out, f'batch-{i // size:03d}.sql'), 'w', encoding='utf-8') as fh:
            fh.write(f"""WITH src AS (
  SELECT * FROM jsonb_to_recordset($shb${payload}$shb$::jsonb)
    AS x(source text, source_ref text, name text, city text, region text, trade text, activity text, slug text)
), fresh AS (
  -- A business already listed from another source under the same name and city is not listed twice.
  SELECT s.* FROM src s WHERE NOT EXISTS (SELECT 1 FROM public.business_listings b
    WHERE lower(b.name) = lower(s.name) AND lower(b.city) = lower(s.city) AND (b.source, b.source_ref) <> (s.source, s.source_ref))
)
INSERT INTO public.business_listings (source, source_ref, name, city, region, trade, activity, slug)
SELECT source, source_ref, name, city, region, trade, activity, slug FROM fresh
ON CONFLICT (source, source_ref) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city, region = EXCLUDED.region,
  trade = EXCLUDED.trade, activity = EXCLUDED.activity, source_synced_at = now();
""")
    with open(os.path.join(out, 'finish.sql'), 'w') as fh:
        fh.write("UPDATE public.business_listings SET status = 'removed' WHERE source = 'shb' AND status = 'listed' AND source_synced_at < now() - interval '6 hours';\n")
    by_trade = {}
    for r in rows: by_trade[r['trade']] = by_trade.get(r['trade'], 0) + 1
    print(json.dumps({'listed': len(rows), 'by_trade': by_trade, 'skipped': skipped}, ensure_ascii=False))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
