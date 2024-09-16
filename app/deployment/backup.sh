#!/bin/bash

set -e

pushd ..

# we need the following vars from this .env file:
# - AWS_BACKUP_BUCKET_NAME
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
source backup.prod.env

echo "Backing up database..."
# --net=host is required so we can hit localhost from inside the container
# really not sure what's wrong with aws cli not getting env vars the normal way
# only dump `public` schema
docker exec -i app-postgres-1 pg_dump -U postgres --exclude-table-data='logging.*' \
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
