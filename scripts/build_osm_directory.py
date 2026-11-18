#!/usr/bin/env python3
"""Turn the OpenStreetMap extract for Quebec into SQL batches for public.business_listings.

Source: OpenStreetMap contributors, Open Database License (ODbL) 1.0.
  Credit line required wherever the data is shown: "© OpenStreetMap contributors".
  The OSM-derived listings (source = 'osm') must be made available under ODbL on request.
Extract: https://download.openstreetmap.fr/extracts/north-america/canada/quebec-latest.osm.pbf

Kept: name, municipality (found from the map position), kind of business, the OSM object id.
Never written: phone, website, email, street address, coordinates.

Needs: pip install osmium shapely
Usage: python3 scripts/build_osm_directory.py <quebec-latest.osm.pbf> <outDir>
"""
import json, os, re, sys, unicodedata
import osmium, shapely
from shapely import wkb

GROCERY = {'supermarket', 'convenience', 'butcher', 'greengrocer', 'deli', 'alcohol', 'cheese', 'seafood', 'health_food', 'farm', 'beverages', 'wine', 'chocolate', 'confectionery', 'spices', 'tea', 'coffee'}
BEAUTY = {'hairdresser', 'beauty', 'cosmetics', 'massage', 'tattoo', 'perfumery', 'hairdresser_supply'}
AUTO = {'car', 'car_repair', 'car_parts', 'tyres', 'motorcycle', 'motorcycle_repair', 'caravan', 'trailer', 'truck'}
HEALTH = {'optician', 'medical_supply', 'hearing_aids', 'chemist', 'herbalist', 'nutrition_supplements'}
HOME = {'dry_cleaning', 'laundry', 'locksmith', 'tailor', 'shoe_repair', 'appliance', 'electronics_repair', 'repair', 'rental', 'storage_rental', 'funeral_directors', 'pest_control'}
SKIP_SHOP = {'vacant', 'no', 'disused'}
BUILD = {'carpenter', 'painter', 'roofer', 'builder', 'tiler', 'glaziery', 'floorer', 'plasterer', 'insulation', 'stonemason', 'bricklayer', 'paver',
         'scaffolder', 'window_construction', 'metal_construction', 'joiner', 'cabinet_maker', 'door_construction', 'welder'}
OFFICE_SKIP = {'government', 'ngo', 'association', 'political_party', 'religion', 'diplomatic', 'educational_institution', 'union', 'charity',
               'foundation', 'administrative', 'quango', 'research', 'university', 'yes', 'vacant'}
AMENITY = {'restaurant': 'Restaurant', 'fast_food': 'Restaurant', 'cafe': 'Bakery and café', 'ice_cream': 'Bakery and café', 'bar': 'Bar', 'pub': 'Bar',
           'nightclub': 'Bar', 'pharmacy': 'Health and wellness', 'dentist': 'Health and wellness', 'doctors': 'Health and wellness',
           'clinic': 'Health and wellness', 'veterinary': 'Health and wellness', 'car_repair': 'Auto services', 'car_wash': 'Auto services',
           'car_rental': 'Auto services', 'fuel': 'Auto services', 'driving_school': 'Other services', 'language_school': 'Other services',
           'music_school': 'Other services', 'cinema': 'Arts and culture', 'theatre': 'Arts and culture', 'studio': 'Professional services',
           'coworking_space': 'Professional services', 'events_venue': 'Hotel and venue', 'animal_boarding': 'Other services',
           'bicycle_rental': 'Fitness and leisure', 'boat_rental': 'Fitness and leisure'}
TOURISM = {'hotel': 'Hotel and venue', 'motel': 'Hotel and venue', 'guest_house': 'Hotel and venue', 'hostel': 'Hotel and venue',
           'chalet': 'Chalets and tourist homes', 'camp_site': 'Camping and outfitters', 'museum': 'Arts and culture', 'gallery': 'Arts and culture',
           'theme_park': 'Fitness and leisure', 'zoo': 'Fitness and leisure', 'aquarium': 'Fitness and leisure'}
LEISURE = {'fitness_centre', 'golf_course', 'bowling_alley', 'dance', 'escape_game', 'miniature_golf', 'horse_riding', 'water_park', 'amusement_arcade'}
HEALTHCARE_SKIP = {'hospital', 'blood_donation', 'vaccination_centre', 'yes'}

def classify(tags):
    """Return (trade, activity) or None."""
    get = tags.get
    v = get('craft')
    if v:
        if v == 'plumber': return 'Plumbing', v
        if v == 'electrician': return 'Electrical', v
        if v == 'hvac': return 'Heating and cooling', v
        if v in BUILD: return 'Construction and renovation', v
        if v in ('brewery', 'winery', 'distillery', 'confectionery'): return 'Farm and local products', v
        if v == 'caterer': return 'Caterer', v
        if v in ('photographer', 'signmaker', 'printer'): return 'Professional services', v
        return 'Home and repair services', v
    v = get('amenity')
    if v in AMENITY: return AMENITY[v], v
    v = get('shop')
    if v and v not in SKIP_SHOP:
        if v in ('bakery', 'pastry'): return 'Bakery and café', v
        if v in GROCERY: return 'Grocery and food shop', v
        if v in BEAUTY: return 'Beauty and personal care', v
        if v in AUTO: return 'Auto services', v
        if v in HEALTH: return 'Health and wellness', v
        if v in HOME: return 'Home and repair services', v
        if v == 'travel_agency': return 'Travel agency', v
        return 'Retail shop', v
    v = get('tourism')
    if v in TOURISM: return TOURISM[v], v
    v = get('healthcare')
    if v and v not in HEALTHCARE_SKIP: return 'Health and wellness', v
    v = get('leisure')
    if v in LEISURE: return 'Fitness and leisure', v
    v = get('office')
    if v and v not in OFFICE_SKIP:
        return ('Travel agency' if v == 'travel_agent' else 'Professional services'), v
    return None

def slugify(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')

def clean(text, limit):
    return re.sub(r'\s+', ' ', text or '').strip()[:limit]

def main(pbf, out):
    os.makedirs(out, exist_ok=True)
    # 1. Municipal boundaries (admin level 8 in Quebec).
    towns, shapes = [], []
    factory = osmium.geom.WKBFactory()
    for obj in osmium.FileProcessor(pbf).with_areas().with_filter(osmium.filter.TagFilter(('boundary', 'administrative'))):
        if not obj.is_area() or obj.tags.get('admin_level') != '8' or not obj.tags.get('name'): continue
        try: shape = wkb.loads(factory.create_multipolygon(obj), hex=True)
        except Exception: continue
        towns.append(clean(obj.tags.get('name:fr') or obj.tags['name'], 120)); shapes.append(shape)
    tree = shapely.STRtree(shapes)
    print(json.dumps({'municipal_boundaries': len(towns)}), flush=True)

    # 2. Named businesses with a position.
    found = []  # (ref, name, trade, activity, lon, lat, addr_city)
    skipped = {'not_a_business': 0, 'public_operator': 0, 'no_position': 0, 'outside_boundaries': 0, 'duplicate': 0, 'incomplete': 0}
    for obj in osmium.FileProcessor(pbf, osmium.osm.NODE | osmium.osm.WAY).with_locations().with_filter(osmium.filter.KeyFilter('name')):
        tags = obj.tags
        kind = classify(tags)
        if not kind: skipped['not_a_business'] += 1; continue
        if tags.get('operator:type') in ('government', 'public') or tags.get('disused') == 'yes' or tags.get('abandoned') == 'yes':
            skipped['public_operator'] += 1; continue
        try:
            if obj.is_node(): lon, lat = obj.location.lon, obj.location.lat
            else:
                first = obj.nodes[0].location
                lon, lat = first.lon, first.lat
        except Exception: skipped['no_position'] += 1; continue
        found.append((('n' if obj.is_node() else 'w') + str(obj.id), clean(tags.get('name:fr') or tags['name'], 200), kind[0],
                      clean(kind[1].replace('_', ' ').capitalize(), 120), lon, lat, clean(tags.get('addr:city', ''), 120)))
    points = shapely.points([f[4] for f in found], [f[5] for f in found])
    pairs = tree.query(points, predicate='within')
    town_of = {}
    for point_index, shape_index in zip(pairs[0].tolist(), pairs[1].tolist()): town_of.setdefault(point_index, towns[shape_index])

    rows, seen = [], set()
    for i, (ref, name, trade, activity, _lon, _lat, addr_city) in enumerate(found):
        city = town_of.get(i)
        if not city: skipped['outside_boundaries'] += 1; continue
        key = (slugify(name), slugify(city))
        if len(name) < 2 or not key[0]: skipped['incomplete'] += 1; continue
        if key in seen: skipped['duplicate'] += 1; continue
        seen.add(key)
        rows.append({'source': 'osm', 'source_ref': ref, 'name': name, 'city': city, 'trade': trade, 'activity': activity,
                     'slug': (key[0][:90] + '-' + key[1][:40] + '-o' + ref)[:160]})
    size = 2500
    for i in range(0, len(rows), size):
        payload = json.dumps(rows[i:i + size], ensure_ascii=False).replace('$osm$', '')
        with open(os.path.join(out, f'batch-{i // size:03d}.sql'), 'w', encoding='utf-8') as fh:
            fh.write(f"""WITH src AS (
  SELECT * FROM jsonb_to_recordset($osm${payload}$osm$::jsonb)
    AS x(source text, source_ref text, name text, city text, trade text, activity text, slug text)
)
INSERT INTO public.business_listings (source, source_ref, name, city, trade, activity, slug)
SELECT source, source_ref, name, city, trade, activity, slug FROM src s
-- A business already listed from another source under the same name and city is not listed twice.
WHERE NOT EXISTS (SELECT 1 FROM public.business_listings b WHERE lower(b.name) = lower(s.name) AND lower(b.city) = lower(s.city) AND b.source <> 'osm')
ON CONFLICT (source, source_ref) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city, trade = EXCLUDED.trade,
  activity = EXCLUDED.activity, source_synced_at = now();
""")
    with open(os.path.join(out, 'finish.sql'), 'w') as fh:
        fh.write("UPDATE public.business_listings SET status = 'removed' WHERE source = 'osm' AND status = 'listed' AND source_synced_at < now() - interval '6 hours';\n")
    by = {}
    for r in rows: by[r['trade']] = by.get(r['trade'], 0) + 1
    print(json.dumps({'listed': len(rows), 'by_trade': by, 'skipped': skipped}, ensure_ascii=False))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
