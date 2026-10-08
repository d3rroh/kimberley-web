#!/usr/bin/env bash
# Runs on the server (piped over SSH by the deploy workflow).
# Pulls the given image, swaps it in for the running container and rolls
# back to the previous container if the new one fails its health check.
#
# Usage: deploy.sh <image:tag> [container-name] [host-port]
set -euo pipefail

IMAGE="${1:?image required}"
NAME="${2:-kimberley-web}"
PORT="${3:-80}"
REPO="${IMAGE%:*}"
OLD="${NAME}-previous"

log() { echo "==> $*"; }

log "Pulling $IMAGE"
docker pull --quiet "$IMAGE"

# Any container already running this site (any tag), whatever it was named by hand.
# `--filter ancestor=` only matches :latest, so match the image name ourselves.
mapfile -t EXISTING < <(
  { docker ps -aq --filter "name=^/${NAME}$"
    docker ps -a --format '{{.ID}} {{.Image}}' |
      awk -v r="$REPO" '{ sub(/^docker\.io\//, "", $2) } $2 == r || index($2, r ":") == 1 { print $1 }'
  } | sort -u
)

docker rm -f "$OLD" >/dev/null 2>&1 || true
CURRENT=""
for id in "${EXISTING[@]}"; do
  [ -n "$id" ] || continue
  if [ -z "$CURRENT" ]; then
    CURRENT="$id"
    log "Stopping current container $(docker inspect -f '{{.Name}}' "$id")"
    docker stop "$id" >/dev/null
    docker rename "$id" "$OLD"
  else
    docker rm -f "$id" >/dev/null
  fi
done

start_new() {
  docker run -d \
    --name "$NAME" \
    --restart unless-stopped \
    -p "${PORT}:80" \
    --read-only \
    --tmpfs /var/cache/nginx --tmpfs /var/run --tmpfs /tmp \
    --cap-drop ALL \
    --cap-add CHOWN --cap-add SETUID --cap-add SETGID --cap-add NET_BIND_SERVICE \
    --security-opt no-new-privileges \
    --memory 128m --pids-limit 100 \
    "$IMAGE" >/dev/null || return 1

  for _ in $(seq 1 15); do
    if docker exec "$NAME" wget -q -O /dev/null http://127.0.0.1/ 2>/dev/null; then
      return 0
    fi
    sleep 2
  done
  return 1
}

log "Starting $NAME on port $PORT"
if ! start_new; then
  log "Deploy FAILED, rolling back"
  docker logs --tail 30 "$NAME" 2>&1 || true
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  if [ -n "$CURRENT" ]; then
    docker rename "$OLD" "$NAME"
    docker start "$NAME" >/dev/null
    log "Previous container restored"
  fi
  exit 1
fi

docker rm -f "$OLD" >/dev/null 2>&1 || true
docker image prune -f >/dev/null || true  # dangling layers only
log "Deployed $IMAGE"
