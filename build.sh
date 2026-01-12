#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR"

command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found"; exit 1; }
[ -f Dockerfile ] || { echo "ERROR: Dockerfile not found in $SCRIPT_DIR"; exit 1; }

IMAGE="${IMAGE:-frankii91/sharp}"
VERSION_FILE="${VERSION_FILE:-version.txt}"
LOCK_FILE="${LOCK_FILE:-.version.lock}"

# ============================================================================
# build.sh — build i tagowanie obrazu + opcjonalne czyszczenie Dockera
#
# UŻYCIE:
#   ./build.sh [opcje]
#
# OPCJE BUDOWANIA:
#   --no-cache
#     Buduje bez użycia cache warstw:
#       docker build --no-cache ...
#     Docker przebuduje wszystkie warstwy od zera (wolniej, ale „na czysto”).
#
# OPCJE CZYSZCZENIA:
#   --prune
#     Wykonuje:
#       docker system prune -f
#     Usuwa:
#       - zatrzymane kontenery
#       - nieużywane sieci
#       - dangling images (niepodpięte do tagów)
#       - build cache
#     NIE usuwa:
#       - obrazów używanych przez kontenery
#       - obrazów z tagami (np. :latest) jeśli są używane/nie-dangling
#       - wolumenów
#
#   --prune-all
#     Wykonuje:
#       docker system prune -a -f --volumes
#     Usuwa WSZYSTKO z --prune oraz dodatkowo:
#       - wszystkie nieużywane obrazy (nie tylko dangling), czyli obrazy bez kontenerów
#       - wolumeny, które nie są używane przez kontenery
#     UWAGA: to może skasować cache i sporo obrazów — kolejne buildy/pulle wolniejsze.
#
#   --prune-cont
#     Wykonuje:
#       docker container prune -f
#     Usuwa wyłącznie zatrzymane kontenery.
#
#   --prune-img
#     Wykonuje:
#       docker image prune -f
#     Usuwa dangling images (obrazy bez tagów / „wiszące”).
#
#   --prune-img-all
#     Wykonuje:
#       docker image prune -a -f
#     Usuwa wszystkie obrazy nieużywane przez kontenery (nie tylko dangling).
#
# HELP:
#   -h / --help  — pokazuje opis i wychodzi
#
# ENV:
#   IMAGE=...         nazwa obrazu (domyślnie: frankii91/sharp)
#   VERSION_FILE=...  plik z wersją (domyślnie: version.txt)
#
# DZIAŁANIE:
#   1) (opcjonalnie) czyszczenie Docker prune wg wybranych flag
#   2) inkrementacja wersji w version.txt (atomowo z flock jeśli dostępny)
#   3) docker build z tagami:
#        IMAGE:latest
#        IMAGE:<BUILD_VERSION>
#   4) weryfikacja, że tagi istnieją lokalnie (docker image inspect)
# ============================================================================

NO_CACHE=0
PRUNE=0
PRUNE_ALL=0
PRUNE_CONT=0
PRUNE_IMG=0
PRUNE_IMG_ALL=0

while [ "${1:-}" != "" ]; do
  case "$1" in
    --no-cache)      NO_CACHE=1 ;;
    --prune)         PRUNE=1 ;;
    --prune-all)     PRUNE_ALL=1 ;;
    --prune-cont)    PRUNE_CONT=1 ;;
    --prune-img)     PRUNE_IMG=1 ;;
    --prune-img-all) PRUNE_IMG_ALL=1 ;;
    -h|--help)
      sed -n '1,200p' "$0" | sed -n '/^# =\{76\}/,/^# =\{76\}/p' | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "ERROR: unknown option: $1"
      exit 1
      ;;
  esac
  shift
done

read_and_bump_version() {
  [ -f "$VERSION_FILE" ] || printf "0\n" > "$VERSION_FILE"

  current_version="$(tr -d '[:space:]' < "$VERSION_FILE" || true)"
  case "$current_version" in
    ''|*[!0-9]*) echo "ERROR: $VERSION_FILE must contain integer"; exit 1 ;;
  esac

  new_version=$((current_version + 1))
  printf "%s\n" "$new_version" > "$VERSION_FILE"
  printf "%s\n" "$new_version"
}

# pruning (optional)
if [ "$PRUNE_ALL" -eq 1 ]; then
  echo "--> PRUNE ALL (docker system prune -a -f --volumes)"
  docker system prune -a -f --volumes
else
  if [ "$PRUNE" -eq 1 ]; then
    echo "--> PRUNE (docker system prune -f)"
    docker system prune -f
  fi
  if [ "$PRUNE_CONT" -eq 1 ]; then
    echo "--> PRUNE CONTAINERS (docker container prune -f)"
    docker container prune -f
  fi
  if [ "$PRUNE_IMG_ALL" -eq 1 ]; then
    echo "--> PRUNE IMAGES ALL (docker image prune -a -f)"
    docker image prune -a -f
  elif [ "$PRUNE_IMG" -eq 1 ]; then
    echo "--> PRUNE IMAGES (docker image prune -f)"
    docker image prune -f
  fi
fi

# version bump with lock (if available)
if command -v flock >/dev/null 2>&1; then
  exec 9>"$LOCK_FILE"
  flock 9
  BUILD_VERSION="$(read_and_bump_version)"
  flock -u 9
else
  BUILD_VERSION="$(read_and_bump_version)"
fi

BUILD_ARGS=""
if [ "$NO_CACHE" -eq 1 ]; then
  BUILD_ARGS="$BUILD_ARGS --no-cache"
fi

echo "--> BUILDING $IMAGE (version: $BUILD_VERSION)"
# shellcheck disable=SC2086
docker build --pull $BUILD_ARGS -f Dockerfile -t "$IMAGE:latest" -t "$IMAGE:$BUILD_VERSION" .

echo "--> VERIFY LOCAL TAGS"
docker image inspect "$IMAGE:latest" >/dev/null
docker image inspect "$IMAGE:$BUILD_VERSION" >/dev/null

echo "SHARP VERSION: $BUILD_VERSION"
echo "--> DONE"
