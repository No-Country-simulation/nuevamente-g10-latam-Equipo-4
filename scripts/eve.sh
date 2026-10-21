#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "${ATLAS_ENV_READY:-0}" != "1" ]; then
  exec node scripts/with-env.mjs bash scripts/eve.sh "$@"
fi
test -n "${EVE_MODEL:-}" || { echo 'Configure EVE_MODEL no .env antes de executar Eve.'; exit 1; }
cd apps/api
case "${1:-start}" in
  build) npm run agent:build ;;
  start) npm run agent:start ;;
  *) echo 'Uso: bash scripts/eve.sh build|start'; exit 1 ;;
esac
