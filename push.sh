#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR"

command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found"; exit 1; }

IMAGE="${IMAGE:-frankii91/sharp}"
VERSION_FILE="${VERSION_FILE:-version.txt}"

[ -f "$VERSION_FILE" ] || { echo "ERROR: missing $VERSION_FILE (run build.sh first)"; exit 1; }
BUILD_VERSION="$(tr -d '[:space:]' < "$VERSION_FILE" || true)"
case "$BUILD_VERSION" in
  ''|*[!0-9]*) echo "ERROR: $VERSION_FILE must contain integer"; exit 1 ;;
esac

echo "SHARP VERSION: $BUILD_VERSION"

echo "--> VERIFY/REPAIR LOCAL TAGS"
if ! docker image inspect "$IMAGE:latest" >/dev/null 2>&1; then
  echo "ERROR: missing local tag $IMAGE:latest (run build.sh first)"
  exit 1
fi

if ! docker image inspect "$IMAGE:$BUILD_VERSION" >/dev/null 2>&1; then
  echo "WARN: missing local tag $IMAGE:$BUILD_VERSION -> creating from :latest"
  docker tag "$IMAGE:latest" "$IMAGE:$BUILD_VERSION"
fi

echo "--> DOCKER LOGIN (if configured)"
if [ -n "${DOCKERHUB_USERNAME:-}" ] && [ -n "${DOCKERHUB_TOKEN:-}" ]; then
  printf "%s" "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
elif [ "${DOCKER_LOGIN:-0}" = "1" ]; then
  docker login
else
  echo "INFO: skipping login (set DOCKERHUB_USERNAME + DOCKERHUB_TOKEN, or DOCKER_LOGIN=1)"
fi

echo "--> PUSHING $IMAGE:latest"
docker push "$IMAGE:latest"
echo "--> PUSHING $IMAGE:$BUILD_VERSION"
docker push "$IMAGE:$BUILD_VERSION"

echo "--> VERIFY REMOTE (if available)"
if docker buildx version >/dev/null 2>&1; then
  docker buildx imagetools inspect "$IMAGE:latest" >/dev/null
  docker buildx imagetools inspect "$IMAGE:$BUILD_VERSION" >/dev/null
elif docker manifest inspect "$IMAGE:latest" >/dev/null 2>&1; then
  docker manifest inspect "$IMAGE:latest" >/dev/null
  docker manifest inspect "$IMAGE:$BUILD_VERSION" >/dev/null
else
  echo "INFO: no remote verification tool available (buildx/manifests missing)"
fi

echo "--> DONE"
