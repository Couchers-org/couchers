#!/bin/bash

set -e

pushd ..
git pull
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
popd
