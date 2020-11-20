#!/bin/bash

set -e

# we need the following vars from this .env file:
# - DATABASE_CONNECTION_STRING
# - AWS_BACKUP_BUCKET_NAME
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
source ../backup.prod.env

docker_image=${DOCKER_IMAGE:-"postgis/postgis:13-3.0"}

# --net=host is required so we can hit localhost from inside the container
# really not sure what's wrong with getting env vars the normal way
docker run --net=host $docker_image pg_dump $DATABASE_CONNECTION_STRING \
  | AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    aws s3 cp - s3://$AWS_BACKUP_BUCKET_NAME/dump-$(date +%s).sql \
  && echo "Done."
