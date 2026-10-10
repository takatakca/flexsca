#!/usr/bin/env python3
"""Read-only production gates. Never sets secrets, creates events, or charges cards."""
import argparse
from datetime import datetime, timezone, timedelta
import json
import os
from pathlib import Path
import subprocess
import sys

PROJECT = 'vcaphsvudlseemkalawz'
ROOT = Path(__file__).resolve().parents[1]
FUNCTIONS = {'create-checkout-session', 'stripe-webhook', 'takatak-attribution-worker'}
SECRETS = {'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'ADS_FLEXS_SERVICE_TOKEN', 'FLEXS_WORKER_TOKEN'}

class ReadinessError(Exception):
    pass

def api(token, path, query=None):
    if not token or '\n' in token or '\r' in token:
        raise ReadinessError('Supabase management token is missing or invalid. Use secure environment settings.')
    config = 'header = ' + json.dumps('Authorization: Bearer ' + token) + '\nheader = "Content-Type: application/json"\n'
    command = ['curl', '--silent', '--show-error', '--fail', '--max-time', '30', '--config', '-']
    if query is not None:
        command += ['--request', 'POST', '--data-binary', json.dumps({'query': query})]
    command += [f'https://api.supabase.com/v1/projects/{PROJECT}/{path}']
    result = subprocess.run(command, input=config, text=True, capture_output=True)
    if result.returncode:
        raise ReadinessError('Management request failed. Credentials and remote response bodies were withheld.')
    try:
        return json.loads(result.stdout)
    except ValueError:
        raise ReadinessError('Unexpected management response; readiness is unverified.') from None

def check_history(rows, versions, deployed=False):
    if not isinstance(rows, list) or any(not isinstance(row, dict) or not isinstance(row.get('version'), str) for row in rows):
        raise ReadinessError('Invalid migration history response.')
    applied = {row['version'] for row in rows}
    unknown = applied - set(versions)
    if unknown:
        raise ReadinessError('Remote migration versions are absent from this checkout. Reconcile remote changes before deployment.')
    pending = [version for version in versions if version not in applied]
    if any(not version.startswith('20261007') for version in pending):
        raise ReadinessError('Historical migrations are missing. Reconcile history before applying release migrations.')
    if deployed and pending:
        raise ReadinessError('Release migrations remain unapplied after deployment.')
    return pending

def check_backup(payload, now):
    # Contract verified from Supabase CLI v2.75.0 generated Management API types.
    if not isinstance(payload, dict):
        raise ReadinessError('Invalid backup response.')
    physical = payload.get('physical_backup_data') or {}
    latest = physical.get('latest_physical_backup_date_unix') if isinstance(physical, dict) else None
    if payload.get('pitr_enabled') is True and isinstance(latest, int) and not isinstance(latest, bool):
        try:
            restored_at = datetime.fromtimestamp(latest, timezone.utc)
            if now-timedelta(hours=48) <= restored_at <= now+timedelta(minutes=5):
                return 'Recent physical recovery point recorded'
        except (ValueError, OverflowError, OSError):
            pass
    backups = payload.get('backups', [])
    if not isinstance(backups, list):
        raise ReadinessError('Invalid backup listing.')
    for backup in backups:
        if not isinstance(backup, dict) or backup.get('status') != 'COMPLETED':
            continue
        try:
            timestamp = datetime.fromisoformat(backup['inserted_at'].replace('Z', '+00:00'))
            if timestamp.tzinfo is not None and now-timedelta(hours=48) <= timestamp <= now+timedelta(minutes=5):
                return 'Completed backup within 48 hours recorded'
        except (KeyError, TypeError, ValueError):
            pass
    raise ReadinessError('No recent completed backup or PITR recovery point was verified. Create and verify recoverability before schema changes.')

def check_secrets(rows):
    if not isinstance(rows, list):
        raise ReadinessError('Invalid secret metadata response.')
    names = {row.get('name') for row in rows if isinstance(row, dict) and isinstance(row.get('name'), str)}
    missing = SECRETS - names
    if missing:
        raise ReadinessError('Missing server-secret names: ' + ', '.join(sorted(missing)))
    # Presence cannot establish correctness, length, expiry, or remote acceptance.
    return 'Required server-secret names exist; values and live validity were not inspected'

def check_functions(rows):
    if not isinstance(rows, list):
        raise ReadinessError('Invalid function metadata response.')
    deployed = {row.get('slug'): row for row in rows if isinstance(row, dict)}
    for name in FUNCTIONS:
        row = deployed.get(name)
        if not row or row.get('status') != 'ACTIVE' or row.get('verify_jwt') is not False:
            raise ReadinessError('Missing, inactive, or mismatched authentication settings for function: ' + name)
    return 'Expected functions are ACTIVE with application-managed authentication'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify-deployed', action='store_true')
    args = parser.parse_args()
    token = os.environ.get('SUPABASE_ACCESS_TOKEN', '')
    if not token:
        raise ReadinessError('SUPABASE_ACCESS_TOKEN is not configured. Supply it securely; do not paste credentials in chat.')
    versions = [path.name.split('_', 1)[0] for path in sorted((ROOT/'supabase/migrations').glob('*.sql'))]
    pending = check_history(api(token, 'database/query', 'SELECT version FROM supabase_migrations.schema_migrations ORDER BY version'), versions, args.verify_deployed)
    print(f'Migration history checked for the declared FLEXS project; {len(pending)} release migrations pending.')
    print(check_backup(api(token, 'database/backups'), datetime.now(timezone.utc)))
    print(check_secrets(api(token, 'secrets')))
    if args.verify_deployed:
        print(check_functions(api(token, 'functions')))
        checks = api(token, 'database/query', """SELECT
          to_regprocedure('public.admin_attribution_health()') IS NOT NULL AS integration_health,
          to_regprocedure('public.admin_retry_attribution(uuid)') IS NOT NULL AS integration_retry,
          to_regprocedure('public.create_support_ticket(text,text,text,uuid)') IS NOT NULL AS support,
          to_regprocedure('public.search_marketplace_leads(jsonb,integer,integer)') IS NOT NULL AS search,
          NOT has_table_privilege('authenticated','public.takatak_attribution_outbox','SELECT') AS outbox_private,
          NOT has_function_privilege('authenticated','public.fulfill_credit_purchase(uuid,text,text,integer,integer,text)','EXECUTE') AS payment_private,
          NOT has_function_privilege('anon','public.admin_attribution_health()','EXECUTE') AS health_private""")
        if not isinstance(checks, list) or len(checks) != 1 or set(checks[0]) != {'integration_health','integration_retry','support','search','outbox_private','payment_private','health_private'} or not all(value is True for value in checks[0].values()):
            raise ReadinessError('Remote RPC or privilege checks failed. Keep the current frontend until resolved.')
        print('Critical RPCs and privilege boundaries verified. Real Auth, Stripe, worker scheduling, and TakaTak delivery still require staging checks.')
    else:
        print('Read-only deployment gates passed. No schema, function, secret, or customer data was changed.')

if __name__ == '__main__':
    try:
        main()
    except ReadinessError as error:
        sys.exit(str(error))
