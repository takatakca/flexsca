#!/usr/bin/env python3
"""Read-only Supabase release checks. Does not change remote schema or secrets."""
import json
import os
from pathlib import Path
import subprocess
import sys

project = 'vcaphsvudlseemkalawz'
token = os.environ.get('SUPABASE_ACCESS_TOKEN')
if not token:
    sys.exit('SUPABASE_ACCESS_TOKEN is not configured. Add it securely in environment settings; do not paste it in chat.')
# Pass authorization through stdin, never command-line arguments or logs.
config = 'header = ' + json.dumps('Authorization: Bearer ' + token) + '\n'
config += 'header = "Content-Type: application/json"\n'
query = "SELECT version FROM supabase_migrations.schema_migrations ORDER BY version"
result = subprocess.run([
    'curl', '--silent', '--show-error', '--fail', '--max-time', '30', '--config', '-',
    '--request', 'POST', '--data-binary', json.dumps({'query': query}),
    f'https://api.supabase.com/v1/projects/{project}/database/query',
], input=config, text=True, capture_output=True)
if result.returncode:
    sys.exit('Supabase management access failed. Check token authorization and network policy; credentials and response bodies were not logged.')
try:
    rows = json.loads(result.stdout)
    applied = {row['version'] for row in rows}
except (ValueError, TypeError, KeyError):
    sys.exit('Unexpected migration-history response; remote readiness is unverified.')
root = Path(__file__).resolve().parents[1]
files = sorted((root / 'supabase/migrations').glob('*.sql'))
pending = [f for f in files if f.name.split('_', 1)[0] not in applied]
print(f'Supabase management access verified for {project}.')
print(f'Applied versions: {len(applied)}; pending repository migrations: {len(pending)}')
for file in pending:
    print(file.name)
if any(not file.name.startswith('20261007') for file in pending):
    sys.exit('Historical migrations are missing from remote history. Reconcile schema before promotion; do not replay seeds blindly.')
