#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "${ATLAS_ENV_READY:-0}" != "1" ]; then
  exec node scripts/with-env.mjs bash scripts/reindex.sh "$@"
fi
task_python="$PWD/.venv/bin/python"
cd services/cognition
"$task_python" -m atlas.reindex
