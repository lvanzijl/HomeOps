#!/bin/sh
set -eu

PROJECT_DIR=${PROJECT_DIR:-$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)}
IMAGE_ARCHIVE=${IMAGE_ARCHIVE:-"$PROJECT_DIR/images/familyboard-app.tar.gz"}
IMAGE_REPOSITORY=${FAMILYBOARD_IMAGE_REPOSITORY:-familyboard-app}
IMAGE_TAG=${FAMILYBOARD_IMAGE_TAG:-dev}
PRUNE_DANGLING_IMAGES=${PRUNE_DANGLING_IMAGES:-false}

printf '==> FamilyBoard Synology deploy in %s\n' "$PROJECT_DIR"
cd "$PROJECT_DIR"

[ -f compose.yaml ] || { echo 'compose.yaml is missing' >&2; exit 1; }
[ -f .env ] || { echo '.env is missing; copy .env.example and set local values' >&2; exit 1; }
[ -f "$IMAGE_ARCHIVE" ] || { echo "image archive is missing: $IMAGE_ARCHIVE" >&2; exit 1; }

printf '==> Loading image archive %s\n' "$IMAGE_ARCHIVE"
docker load -i "$IMAGE_ARCHIVE"

printf '==> Verifying image %s:%s\n' "$IMAGE_REPOSITORY" "$IMAGE_TAG"
docker image inspect "$IMAGE_REPOSITORY:$IMAGE_TAG" >/dev/null

printf '==> Validating compose configuration\n'
docker compose --env-file .env -f compose.yaml config >/dev/null

printf '==> Starting compose project\n'
docker compose --env-file .env -f compose.yaml up --detach --remove-orphans

if [ "$PRUNE_DANGLING_IMAGES" = "true" ]; then
  printf '==> Pruning dangling images only\n'
  docker image prune --force --filter dangling=true
fi

printf '==> Deployment complete\n'
