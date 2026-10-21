#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Explicit destinations avoid accidentally publishing to a renamed local remote.
atlas_head=$(git rev-parse HEAD)
for atlas_remote in \
  https://github.com/Oracle-hackatom-g10-team-4/Nova-mente-Solution.git \
  https://github.com/No-Country-simulation/nuevamente-g10-latam-Equipo-4.git; do
  if ! git push "$atlas_remote" HEAD:refs/heads/main; then
    echo 'Sincronização incompleta. Preserve os commits locais e resolva o acesso/divergência; nenhum force push foi usado.' >&2
    exit 1
  fi
  atlas_published=$(git ls-remote "$atlas_remote" refs/heads/main | cut -f1)
  test "$atlas_published" = "$atlas_head" || { echo 'O destino não confirmou o mesmo commit.' >&2; exit 1; }
done
echo "Dois repositórios confirmados no commit $atlas_head"
