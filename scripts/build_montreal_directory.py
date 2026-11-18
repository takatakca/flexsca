#!/usr/bin/env python3
"""Turn Ville de Montréal open data into SQL batches for public.business_listings.

Sources (both CC BY 4.0, https://donnees.montreal.ca):
  - "Établissements alimentaires" (businesses.csv): restaurants, bars, bakeries, food shops.
  - "Locaux commerciaux et statuts d'occupation" (occupation-commerciale-<year>.csv): street-level businesses.

Only the name, municipality, borough, kind of business and the source's record number are
kept. Street addresses and coordinates are read to remove duplicates and are never written out.

Usage: python3 -I scripts/build_montreal_directory.py <businesses.csv> <occupation-commerciale.csv> <outDir>
Then run the batch-*.sql files with a service connection, then finish.sql.
"""
import csv, json, os, re, sys, unicodedata

FOOD = {
    'Restaurant': {'Restaurant', 'Restaurant service rapide', 'Casse-croûte', 'Restaurant mets pour emporter', 'Camion-cuisine', 'Cantine mobile', 'Brasserie'},
    'Bar': {'Bar salon, taverne'},
    'Bakery and café': {'Pâtisserie/Boulangerie', 'Boulangerie', 'Confiserie/chocolaterie', 'Bar laitier', 'Bar laitier saisonnier', 'Café, thé, infusion, tisane', 'Pâtisserie-dépôt'},
    'Grocery and food shop': {'Épicerie', 'Épicerie avec préparation', 'Boucherie-épicerie', 'Supermarché', 'Charcuterie', 'Boucherie', 'Aliments naturels', 'Poissonnerie', 'Charcuterie/fromage', 'Magasin à rayons'},
    'Caterer': {'Traiteur'},
}
FOOD_TRADE = {kind: trade for trade, kinds in FOOD.items() for kind in kinds}

SHOPS_BY_USE2 = {
    'Restauration': 'Restaurant', 'Débits de boisson': 'Bar', 'Alimentation': 'Grocery and food shop',
    'Hôtellerie': 'Hotel and venue', 'Salle de réception': 'Hotel and venue',
    'Diffusion culturelle': 'Fitness and leisure', 'Installations sportives et de loisirs': 'Fitness and leisure',
    'Centres de conditionnement et studios de santé': 'Fitness and leisure',
    'Pharmacie': 'Health and wellness', 'Produits de santé': 'Health and wellness', 'Professionnels de la santé et assistance sociale': 'Health and wellness',
    'Entretien automobile': 'Auto services', 'Automobiles et véhicules récréatifs': 'Auto services',
    'Entretien des tissus': 'Home and repair services', 'Réparation': 'Home and repair services', 'Location': 'Home and repair services',
    'Installation et vente': 'Home and repair services', "Services d'entretien commercial": 'Home and repair services', 'Exterminateur': 'Home and repair services',
    'Construction et entrepreneur général': 'Construction and renovation',
}
SHOPS_BY_USE1 = {
    'Biens courants': 'Retail shop', 'Biens semi-courants': 'Retail shop', 'Biens réfléchis (durables)': 'Retail shop',
    'Soins personnels': 'Beauty and personal care', 'Services professionnels': 'Professional services',
    "Services d'affaires": 'Professional services', 'Services aux consommateurs': 'Other services', 'Autres': 'Other services',
}
SHOPS_SKIP = {'VACANT', 'Organismes religieux, fondations, groupes de citoyens et organisations similaires', 'Organismes publiques',
              'Centres de la petite enfance (CPE) et garderie', 'Banques et caisses populaires, guichet automatique'}
BOROUGHS = {'St-Laurent', 'St-Léonard', 'Montréal-Nord', 'LaSalle', 'Verdun', 'Anjou', 'Lachine', 'Pierrefonds', 'Outremont', 'Roxboro',
            "L'Ile Bizard", 'Pointe-aux-Trembles', 'Ste-Geneviève', 'Rivière-des-Prairies', 'Ville-Marie', 'Le Plateau-Mont-Royal',
            'Rosemont–La Petite-Patrie', 'Villeray–Saint-Michel–Parc-Extension', 'Côte-des-Neiges-Notre-Dame-de-Grâce', 'Ahuntsic–Cartierville',
            'Mercier–Hochelaga-Maisonneuve', 'Le Sud-Ouest', 'Saint-Léonard', 'Saint-Laurent', 'Rivière-des-Prairies–Pointe-aux-Trembles',
            'Pierrefonds-Roxboro', 'L’Île-Bizard–Sainte-Geneviève'}
SMALL = {'de', 'du', 'la', 'le', 'les', 'des', 'et', 'au', 'aux', 'en', 'chez', 'sur', 'the', 'and', 'of'}

def slugify(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')

def clean(text, limit):
    return re.sub(r'\s+', ' ', text or '').strip()[:limit]

def tidy_name(name):
    """Source names are mostly capitals. Keep short acronyms, calm the rest."""
    name = clean(name, 200)
    if not name.isupper(): return name
    words = []
    for i, word in enumerate(name.split(' ')):
        low = word.lower()
        if i and low in SMALL: words.append(low)
        elif len(re.sub(r'[^A-Za-zÀ-ÿ]', '', word)) <= 3 and low not in SMALL: words.append(word)
        else: words.append(re.sub(r"(^|[-'’/&(.])([a-zà-ÿ])", lambda m: m.group(1) + m.group(2).upper(), low))
    return ' '.join(words)

def place(raw):
    raw = clean(raw, 120)
    full = re.sub(r'\bSte-', 'Sainte-', re.sub(r'\bSt-', 'Saint-', raw))
    return ('Montréal', full) if raw in BOROUGHS else (full, None if raw == 'Montréal' else 'Montréal')

def dedupe_key(name, address):
    number = re.match(r'\s*(\d+)', address or '')
    return (slugify(name), number.group(1) if number else '')

def main(food_csv, shops_csv, out):
    os.makedirs(out, exist_ok=True)
    rows, seen, skipped = [], set(), {'food_closed_or_other': 0, 'shops_vacant_or_excluded': 0, 'duplicate': 0, 'incomplete': 0}
    with open(food_csv, encoding='utf-8-sig', newline='') as fh:
        for r in csv.DictReader(fh):
            trade = FOOD_TRADE.get(r['type']) if r['statut'] == 'Ouvert' else None
            if not trade: skipped['food_closed_or_other'] += 1; continue
            name = tidy_name(r['name']); city, region = place(r['city'])
            if len(name) < 2 or not city or not r['business_id'].isdigit(): skipped['incomplete'] += 1; continue
            key = dedupe_key(name, r['address'])
            if key in seen: skipped['duplicate'] += 1; continue
            seen.add(key)
            rows.append({'source': 'mtl_food', 'source_ref': r['business_id'], 'name': name, 'city': city, 'region': region, 'trade': trade,
                         'activity': clean(r['type'], 120), 'slug': (slugify(name)[:90] + '-' + slugify(city)[:40] + '-f' + r['business_id'])[:160]})
    with open(shops_csv, encoding='utf-8-sig', newline='') as fh:
        for r in csv.DictReader(fh):
            if r['USAGE1'] == 'VACANT' or r['USAGE2'] in SHOPS_SKIP: skipped['shops_vacant_or_excluded'] += 1; continue
            trade = SHOPS_BY_USE2.get(r['USAGE2']) or SHOPS_BY_USE1.get(r['USAGE1'])
            name = tidy_name(r['NOM_ETAB']); city, region = place(r['ARRONDISSEMENT'])
            ref = re.sub(r'[^0-9a-z-]', '', r['ID'].lower()).strip('-')[:40]
            if not trade or len(name) < 2 or name.upper() in ('N/A', 'ND', 'INCONNU') or not city or len(ref) < 6: skipped['incomplete'] += 1; continue
            key = dedupe_key(name, r['CIVIQUE'])
            if key in seen: skipped['duplicate'] += 1; continue
            seen.add(key)
            rows.append({'source': 'mtl_shops', 'source_ref': ref, 'name': name, 'city': city, 'region': region, 'trade': trade,
                         'activity': clean(r['USAGE3'] or r['USAGE2'], 120), 'slug': (slugify(name)[:90] + '-' + slugify(city)[:40] + '-s' + ref.replace('-', '')[:14])[:160]})
    rows = [r for r in rows if re.fullmatch(r'[a-z0-9-]{3,160}', r['slug'])]
    size = 2500
    for i in range(0, len(rows), size):
        payload = json.dumps(rows[i:i + size], ensure_ascii=False).replace('$mtl$', '')
        with open(os.path.join(out, f'batch-{i // size:03d}.sql'), 'w', encoding='utf-8') as fh:
            fh.write(f"""INSERT INTO public.business_listings (source, source_ref, name, city, region, trade, activity, slug)
SELECT source, source_ref, name, city, region, trade, activity, slug FROM jsonb_to_recordset($mtl${payload}$mtl$::jsonb)
  AS x(source text, source_ref text, name text, city text, region text, trade text, activity text, slug text)
ON CONFLICT (source, source_ref) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city, region = EXCLUDED.region,
  trade = EXCLUDED.trade, activity = EXCLUDED.activity, source_synced_at = now();
""")
    with open(os.path.join(out, 'finish.sql'), 'w') as fh:
        fh.write("UPDATE public.business_listings SET status = 'removed' WHERE source IN ('mtl_food','mtl_shops') AND status = 'listed' AND source_synced_at < now() - interval '6 hours';\n")
    by_trade = {}
    for r in rows: by_trade[r['trade']] = by_trade.get(r['trade'], 0) + 1
    print(json.dumps({'listed': len(rows), 'by_trade': by_trade, 'skipped': skipped}, ensure_ascii=False))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
