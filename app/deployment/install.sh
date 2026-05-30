#!/bin/bash

set -e

pushd ..
git pull
docker compose -f docker-compose.prod.yml pull

docker ps -a --filter "label=com.docker.compose.project=app" --format '{{.Names}}' \
  | grep -E '^[0-9a-f]+_' \
  | xargs -r docker rm -f || true

docker compose -f docker-compose.prod.yml up -d

docker image prune -af --filter "until=24h"
popd
