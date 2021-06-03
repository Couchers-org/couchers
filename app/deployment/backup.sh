#!/bin/bash

set -e

pushd ..

# we need the following vars from this .env file:
# - DATABASE_CONNECTION_STRING
# - AWS_BACKUP_BUCKET_NAME
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
source backup.prod.env

docker_image=${DB_DOCKER_IMAGE:-"postgis/postgis:13-3.1"}

echo "Backing up database..."
# --net=host is required so we can hit localhost from inside the container
# really not sure what's wrong with aws cli not getting env vars the normal way
docker run --net=host $docker_image pg_dump $DATABASE_CONNECTION_STRING \
  | gzip \
  | AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    aws s3 cp - s3://$AWS_BACKUP_BUCKET_NAME/db/dump-$(date +%s).sql.gz \
  && echo "Done."

echo "Backing up user media..."
sudo tar czf - data/media \
  | AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    aws s3 cp - s3://$AWS_BACKUP_BUCKET_NAME/media/media-$(date +%s).tar.gz \
  && echo "Done."

popd
