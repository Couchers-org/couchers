#!/bin/bash

set -e

pushd ..

# we need the following vars from this .env file:
# - DATABASE_CONNECTION_STRING
source backup.prod.env

docker_image=${DB_DOCKER_IMAGE:-"postgis/postgis:17-3.5"}

# --net=host is required so we can hit localhost from inside the container
docker run --log-driver none --net=host -it $docker_image psql $DATABASE_CONNECTION_STRING

popd
