#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
quality_sha=d9b145878d2f3d1d9956edb82a1ecbbbd50a4862
quality_dir="$PWD/.quality-tools/engine"
if [ ! -d "$quality_dir/.git" ]; then
  git clone https://github.com/andrecodexvictor/Quality-engine.git "$quality_dir"
fi
test -z "$(git -C "$quality_dir" status --porcelain)" || { echo 'Checkout Quality Engine alterado; preserve as mudanças e revise.'; exit 1; }
git -C "$quality_dir" checkout --detach "$quality_sha"
test "$(git -C "$quality_dir" rev-parse HEAD)" = "$quality_sha"
npm ci --prefix "$quality_dir" --ignore-scripts --no-audit --no-fund
mkdir -p "$quality_dir/.lint-sandbox"
python3 -m venv .venv-quality
.venv-quality/bin/pip install -r scripts/quality/requirements.lock
