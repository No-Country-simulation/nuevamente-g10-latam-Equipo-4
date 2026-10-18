#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
source .env
set +a
task_python="$PWD/.venv/bin/python"
cd services/cognition
"$task_python" -m atlas.reindex
