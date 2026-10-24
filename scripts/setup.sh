#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-/tmp/codex-npm-cache}"
python3 - <<'PY'
from pathlib import Path
import os, secrets
path=Path('.env')
if not path.exists():
    path.write_text(Path('.env.example').read_text())
text=path.read_text()
if '\nATLAS_INTERNAL_TOKEN=\n' in '\n'+text:
    text=text.replace('ATLAS_INTERNAL_TOKEN=\n','ATLAS_INTERNAL_TOKEN='+secrets.token_hex(32)+'\n')
    path.write_text(text)
os.chmod(path,0o600)
PY
npm ci
node scripts/init-vault.mjs
python3 -m venv .venv
.venv/bin/pip install -r services/cognition/requirements.lock
