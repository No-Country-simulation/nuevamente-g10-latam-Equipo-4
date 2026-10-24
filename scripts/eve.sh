#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "${ATLAS_ENV_READY:-0}" != "1" ]; then
  exec node scripts/with-env.mjs bash scripts/eve.sh "$@"
fi
cd apps/api
case "${1:-start}" in
  build) npm run agent:build ;;
  start) npm run agent:start ;;
  dev) npx --no-install eve dev --host 127.0.0.1 --port 2000 ;;
  *) echo 'Uso: bash scripts/eve.sh build|start|dev'; exit 1 ;;
esac
