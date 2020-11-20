#!/bin/bash

set -e

./backup.sh

pushd ..
git pull
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
popd
