#!/bin/bash

set -e

pushd ..
git pull
docker compose -f docker-compose.prod.yml pull

# Remove leftovers from a previously-interrupted recreate (named "<id>_<service>").
# They squat the rename target and make `up` fail with a name conflict.
docker ps -a --filter "label=com.docker.compose.project=app" --format '{{.Names}}' \
  | grep -E '^[0-9a-f]+_' \
  | xargs -r docker rm -f || true

docker compose -f docker-compose.prod.yml up -d

# Reclaim disk: drop images no longer referenced by a container. The new stack is
# already up holding refs to the images it needs, so only stale ones are removed.
docker image prune -af
popd
