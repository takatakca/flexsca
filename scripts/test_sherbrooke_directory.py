#!/usr/bin/env python3
"""Checks for scripts/build_sherbrooke_directory.py. Run: python3 -I scripts/test_sherbrooke_directory.py"""
import importlib.util, os
spec = importlib.util.spec_from_file_location('shb', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build_sherbrooke_directory.py'))
shb = importlib.util.module_from_spec(spec); spec.loader.exec_module(shb)

def row(**over):
    base = {'id': '639772dc-3588-4fa8-92a0-85590ee22bf5', 'no_civique': '12', 'rue': 'Rue Secrète', 'code_postal': 'J1N 1C3', 'telephone': '819 555-0100',
            'neq': '1176103209', 'lng': '-71.9', 'lat': '45.3', 'entreprise': 'PLOMBERIE DU LAC INC.', 'type_etablissement': 'Commerce',
            'usage_1': 'Construction', 'usage_2': 'Construction', 'usage_3': 'Entrepreneurs en plomberie'}
    base.update(over); return base

rows, skipped = shb.build([
    row(),
    row(id='b7b58c67-d027-4a34-afc0-0bfd69ac9c7a'),                                            # same name: one listing
    row(id='a326b4a2-0b3a-4c40-a32f-ff277b50a478', entreprise='VACANT', usage_1='VACANT', usage_2='VACANT'),
    row(id='50f75464-e3bc-497d-9a75-9a7dc14c4cc7', entreprise='ÉCOLE DU COIN', usage_1="Services d'enseignement", usage_2="Services d'enseignement"),
    row(id='85ad19a5-c4fd-46bf-b3ff-1242171832d2', entreprise='GARDERIE X', usage_1='Services professionnels', usage_2='Centre de la petite enfance (CPE) et garderie'),
    row(id='7b21ae3f-ce9a-407d-83c0-aecca2261df2', entreprise='BAR LE LIVERPOOL', usage_1='Restauration, divertissement et hôtellerie', usage_2='Débits de boissons alcoolisées', usage_3='Débits de boissons alcoolisées'),
    row(id='not-a-uuid', entreprise='SANS NUMÉRO'),
    row(id='11111111-2222-4333-8444-555555555555', entreprise='DR JEAN UNTEL DENTISTE'),                     # a person's title: left out
])
assert [r['name'] for r in rows] == ['Plomberie du Lac Inc.', 'Bar le Liverpool'], rows
assert rows[0]['trade'] == 'Construction and renovation' and rows[1]['trade'] == 'Bar'
assert all(r['city'] == 'Sherbrooke' and r['region'] == 'Estrie' and r['source'] == 'shb' for r in rows)
assert skipped == {'vacant_or_excluded': 4, 'incomplete': 1, 'duplicate': 1}, skipped
# Nothing private leaves the source file: no address, phone, postal code, NEQ or position.
blob = repr(rows)
for private in ('Rue Secrète', 'J1N', '555-0100', '1176103209', '45.3', '-71.9'):
    assert private not in blob, private
assert set(rows[0]) == {'source', 'source_ref', 'name', 'city', 'region', 'trade', 'activity', 'slug'}
print('PASS Sherbrooke directory importer: mapping, exclusions, one listing per name, no private fields')
