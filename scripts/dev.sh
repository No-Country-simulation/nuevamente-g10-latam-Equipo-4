#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
test -f .env || { echo 'Execute bash scripts/setup.sh primeiro.'; exit 1; }
if [ "${ATLAS_ENV_READY:-0}" != "1" ]; then
  exec node scripts/with-env.mjs bash scripts/dev.sh "$@"
fi
task_root="$PWD"
task_pids=()
cleanup() { for task_pid in "${task_pids[@]}"; do kill -- -"$task_pid" 2>/dev/null || true; done; }
trap cleanup EXIT INT TERM
cd "$task_root/services/cognition"
setsid "$task_root/.venv/bin/uvicorn" atlas.main:app --host "${ATLAS_BIND_ADDRESS:-127.0.0.1}" --port 8000 &
task_pids+=("$!")
cd "$task_root"
setsid npm run dev:api &
task_pids+=("$!")
setsid npm run dev:web &
task_pids+=("$!")
wait -n
