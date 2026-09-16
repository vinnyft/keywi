#!/bin/sh
# ------------------------------------------------------------------
# Enveloppe de la CLI Supabase.
#
# La CLI ne parle qu'à un seul démon Docker : celui du contexte actif.
# Or le stack local peut très bien tourner ailleurs — Lima, Colima,
# OrbStack — auquel cas `supabase status` répond « supabase start is
# not running » alors que la base écoute bel et bien sur 54322.
#
# Ce script désigne à la CLI le démon qui héberge réellement le
# conteneur du projet, puis lui passe la main.
#
#   ./scripts/supabase.sh status
#   ./scripts/supabase.sh db reset
# ------------------------------------------------------------------
set -e

PROJET=$(sed -n 's/^project_id *= *"\(.*\)"/\1/p' "$(dirname "$0")/../supabase/config.toml" | head -1)
CONTENEUR="supabase_db_${PROJET}"

# Candidats, du plus courant au plus rare. $DOCKER_HOST déjà défini
# passe en premier : un réglage explicite n'est jamais écrasé.
SOCKETS="${DOCKER_HOST:-}
unix://$HOME/.docker/run/docker.sock
unix://$HOME/.lima/docker/sock/docker.sock
unix://$HOME/.colima/default/docker.sock
unix://$HOME/.orbstack/run/docker.sock
unix:///var/run/docker.sock"

trouve=""
premier_vivant=""

for socket in $SOCKETS; do
  [ -z "$socket" ] && continue
  [ -S "${socket#unix://}" ] || continue
  docker -H "$socket" info >/dev/null 2>&1 || continue
  [ -z "$premier_vivant" ] && premier_vivant="$socket"

  # L'endpoint qui héberge le conteneur du projet l'emporte
  if docker -H "$socket" ps -a --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTENEUR"; then
    trouve="$socket"
    break
  fi
done

DOCKER_HOST="${trouve:-$premier_vivant}"
[ -n "$DOCKER_HOST" ] && export DOCKER_HOST

exec npx supabase "$@"
