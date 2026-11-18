#!/usr/bin/env python3
"""Turn two province-wide open datasets into SQL batches for public.business_listings.

Sources (CC BY 4.0, https://www.donneesquebec.ca):
  - Office de la protection du consommateur, "Liste des permis et des exemptions en vigueur" (opc.csv).
  - Ministère du Tourisme, "Système d'information touristique Québec" (the sit-quebec-*.csv files).

Kept: name, municipality, region, kind of business, the source's record number.
Never written: phone, street address, postal code, website, coordinates. An email, when the
source has one, is reduced to a SHA-256 so the real owner can claim the listing at once.

Usage: python3 -I scripts/build_quebec_open_directory.py <dir with opc.csv and sit-*.csv> <outDir>
"""
import csv, glob, hashlib, io, json, os, re, sys, unicodedata

OPC = {'Commerçant de véhicules routiers': ('Auto services', 'Commerçant de véhicules routiers'),
       'Recycleur de véhicules routiers': ('Auto services', 'Recycleur de véhicules routiers'),
       "Exploitant d'un studio de santé": ('Fitness and leisure', 'Studio de santé'),
       'Agent de voyages - Général': ('Travel agency', 'Agent de voyages')}
COMPANY = re.compile(r"\b(inc|ltée|ltee|ltd|enr|s\.?e\.?n\.?c|corp|cie|limitée|limited|coop|s\.?e\.?c)\b\.?|\d{4}-\d{4}", re.I)

SIT_FILE = {  # file suffix -> default trade (None = decide by TypeEtablissement)
    'hotels': 'Hotel and venue', 'gites': 'Hotel and venue', 'hebergements-collectifs': 'Hotel and venue',
    'congres-et-tourisme-d-affaires': 'Hotel and venue', 'campings': 'Camping and outfitters', 'pourvoiries': 'Camping and outfitters',
    'restauration': 'Restaurant', 'agrotourisme-et-saveurs-regionales': 'Farm and local products',
    'divertissements-et-loisirs': 'Fitness and leisure', 'nature-sports-et-plein-air': 'Fitness and leisure',
    'culture-art-et-patrimoine': 'Arts and culture', 'transport': 'Transport', 'services-connexes': 'Other services',
}
SIT_LABEL = {'hotels': 'Hôtel', 'gites': 'Gîte touristique', 'hebergements-collectifs': 'Hébergement collectif', 'campings': 'Camping', 'pourvoiries': 'Pourvoirie'}
SIT_TYPE = {'Café / salon de thé': 'Bakery and café', 'Comptoir de crème glacée': 'Bakery and café', 'Traiteur': 'Caterer',
            'Bar, boîte de nuit': 'Bar', 'Centre de santé, spa': 'Beauty and personal care', 'Agence de voyages': 'Travel agency',
            'Magasin, boutique': 'Retail shop', 'Centre commercial': 'Retail shop', 'Microbrasserie': 'Bar',
            'Pâtissier / boulanger': 'Bakery and café', 'Loueur de véhicules': 'Auto services'}
# Places that are not businesses an owner would claim.
SIT_SKIP = re.compile(r"parc |^plage|piste|sentier|belvédère|monument|religieux|patrimoine architectural|site naturel|glissoire|"
                      r"information touristique|aéroport|stationnement|gare|halte|traversier|pont |réserve|zec|jardin|barrage|phare|marina municipale", re.I)

def slugify(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')

def clean(text, limit):
    return re.sub(r'\s+', ' ', text or '').strip()[:limit]

def read(path):
    text = open(path, 'rb').read().decode('utf-8-sig', 'replace')
    return list(csv.DictReader(io.StringIO(text), dialect=csv.Sniffer().sniff(text[:5000], delimiters=',;\t|')))

def email_hash(value):
    email = (value or '').strip().lower()
    return hashlib.sha256(email.encode()).hexdigest() if re.fullmatch(r'[^@\s|;,]+@[^@\s|;,]+\.[^@\s|;,]+', email) else None

def main(src, out):
    os.makedirs(out, exist_ok=True)
    rows, seen, skipped = [], set(), {'opc_category': 0, 'opc_person_name': 0, 'sit_not_a_business': 0, 'outside_quebec': 0, 'duplicate': 0, 'incomplete': 0}

    def add(source, ref, name, city, region, trade, activity, email):
        name, city = clean(name, 200), clean(city, 120)
        ref = re.sub(r'[^0-9A-Za-z-]', '', ref)[:40]
        if len(name) < 2 or not city or len(ref) < 4: skipped['incomplete'] += 1; return
        key = (slugify(name), slugify(city))
        if key in seen or (source, ref) in seen: skipped['duplicate'] += 1; return
        seen.add(key); seen.add((source, ref))
        slug = (slugify(name)[:90] + '-' + slugify(city)[:40] + '-' + source[0] + slugify(ref).replace('-', '')[:16])[:160]
        if not re.fullmatch(r'[a-z0-9-]{3,160}', slug): skipped['incomplete'] += 1; return
        rows.append({'source': source, 'source_ref': ref, 'name': name, 'city': city, 'region': clean(region, 120) or None,
                     'trade': trade, 'activity': clean(activity, 120) or None, 'slug': slug, 'email_sha256': email})

    for r in read(os.path.join(src, 'opc.csv')):
        kind = OPC.get(r['CATEGORIE_PERMIS'])
        if not kind: skipped['opc_category'] += 1; continue
        other = clean(re.split(r'//|;|\|', r['AUTRES_NOMS'])[0], 200)
        legal = clean(r['NOM_COMMERCANT'], 200)
        # A permit in a person's own name with no trade name is left out.
        if not other and not COMPANY.search(legal): skipped['opc_person_name'] += 1; continue
        # One permit can cover branches in several towns: the town is part of the record key.
        add('opc', r['NO_PERMIS'] + '-' + slugify(r['ETABLISSEMENT_VILLE'])[:20], other or legal, r['ETABLISSEMENT_VILLE'], None, kind[0], kind[1], None)

    for path in sorted(glob.glob(os.path.join(src, 'sit-*.csv'))):
        suffix = os.path.basename(path)[4:-4]
        if suffix not in SIT_FILE: continue
        for r in read(path):
            if slugify(r.get('ProvinceEtat', '')) != 'quebec': skipped['outside_quebec'] += 1; continue
            kind = clean(r.get('TypeEtablissement', ''), 120) or SIT_LABEL.get(suffix, '')
            if SIT_SKIP.search(kind) or SIT_SKIP.search(r['NomEtablissement'][:12]): skipped['sit_not_a_business'] += 1; continue
            add('sit', r['IdentifiantUnique'], r['NomEtablissement'], r['Municipalite'], r.get('RegionAdministrative'),
                SIT_TYPE.get(kind, SIT_FILE[suffix]), kind, email_hash(r.get('Courriel')))

    size = 2500
    for i in range(0, len(rows), size):
        payload = json.dumps(rows[i:i + size], ensure_ascii=False).replace('$qc$', '')
        with open(os.path.join(out, f'batch-{i // size:03d}.sql'), 'w', encoding='utf-8') as fh:
            fh.write(f"""WITH src AS (
  SELECT * FROM jsonb_to_recordset($qc${payload}$qc$::jsonb)
    AS x(source text, source_ref text, name text, city text, region text, trade text, activity text, slug text, email_sha256 text)
), fresh AS (
  -- A business already listed from another source under the same name and city is not listed twice.
  SELECT s.* FROM src s WHERE NOT EXISTS (SELECT 1 FROM public.business_listings b
    WHERE lower(b.name) = lower(s.name) AND lower(b.city) = lower(s.city) AND (b.source, b.source_ref) <> (s.source, s.source_ref))
), up AS (
  INSERT INTO public.business_listings (source, source_ref, name, city, region, trade, activity, slug)
  SELECT source, source_ref, name, city, region, trade, activity, slug FROM fresh
  ON CONFLICT (source, source_ref) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city, region = EXCLUDED.region,
    trade = EXCLUDED.trade, activity = EXCLUDED.activity, source_synced_at = now()
  RETURNING id, source, source_ref, status
)
INSERT INTO public.business_listing_verifiers (listing_id, email_sha256)
SELECT up.id, src.email_sha256 FROM up JOIN src USING (source, source_ref) WHERE src.email_sha256 IS NOT NULL AND up.status = 'listed'
ON CONFLICT (listing_id) DO UPDATE SET email_sha256 = EXCLUDED.email_sha256;
""")
    with open(os.path.join(out, 'finish.sql'), 'w') as fh:
        fh.write("UPDATE public.business_listings SET status = 'removed' WHERE source IN ('opc','sit') AND status = 'listed' AND source_synced_at < now() - interval '6 hours';\n")
    by = {}
    for r in rows: by[r['source'] + ' / ' + r['trade']] = by.get(r['source'] + ' / ' + r['trade'], 0) + 1
    print(json.dumps({'listed': len(rows), 'by': by, 'skipped': skipped}, ensure_ascii=False))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
