#!/usr/bin/env bash
# Authorized deployment entry point. Backend only; preserves server secrets/data.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" || -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo 'Deployment cannot start: secure SUPABASE_ACCESS_TOKEN and SUPABASE_DB_PASSWORD bindings are required.' >&2
  exit 1
fi
# The local cloud workspace and the CI runner use the same verified CLI version.
flexs_cli="${FLEXS_SUPABASE_CLI:-supabase}"
if ! command -v "$flexs_cli" >/dev/null 2>&1; then
  if [[ -x /workspace/.onboarding-tools/bin/supabase ]]; then
    flexs_cli=/workspace/.onboarding-tools/bin/supabase
  else
    echo 'Supabase CLI is unavailable. Install the validated version 2.75.0.' >&2
    exit 1
  fi
fi
[[ "$("$flexs_cli" --version)" == '2.75.0' ]] || { echo 'Use validated Supabase CLI 2.75.0.' >&2; exit 1; }
python3 scripts/backend-readiness.py
"$flexs_cli" link --project-ref vcaphsvudlseemkalawz --yes
"$flexs_cli" db push --linked --dry-run
"$flexs_cli" db push --linked --yes
for flexs_function in create-checkout-session stripe-webhook takatak-attribution-worker; do
  "$flexs_cli" functions deploy "$flexs_function" --project-ref vcaphsvudlseemkalawz --use-api
 done
python3 scripts/backend-readiness.py --verify-deployed
