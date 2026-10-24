#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# These values are identifiers, never credentials. .env remains on the VM.
: "${ATLAS_IMAGE_PREFIX:?Export ghcr.io/owner/repository in lowercase}"
: "${ATLAS_IMAGE_TAG:?Export the full Git SHA from a successful published build}"
[[ "$ATLAS_IMAGE_PREFIX" =~ ^ghcr\.io/[a-z0-9_.-]+/[a-z0-9_.-]+$ ]] || { echo 'Invalid GHCR prefix'; exit 1; }
[[ "$ATLAS_IMAGE_TAG" =~ ^[a-f0-9]{40}$ ]] || { echo 'Use an immutable full Git SHA'; exit 1; }
test -f .env || { echo 'Prepare a private .env on this VM first'; exit 1; }
docker compose -f compose.deploy.yaml "$@" config --quiet
docker compose -f compose.deploy.yaml "$@" pull
docker compose -f compose.deploy.yaml "$@" up -d --no-build --wait
docker compose -f compose.deploy.yaml "$@" ps
