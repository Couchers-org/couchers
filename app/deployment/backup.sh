#!/bin/bash

set -e

pushd ..

# we need the following vars from this .env file:
# - AWS_BACKUP_BUCKET_NAME
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
# - CONFIG_FILE_AGE_PUBKEY
source backup.prod.env

backup_time=$(date +%s)

# really not sure what's wrong with aws cli not getting env vars the normal way

echo "Backing up config..."
tar cf - *.prod.env \
  | age -r $CONFIG_FILE_AGE_PUBKEY \
  | AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    aws s3 cp - s3://$AWS_BACKUP_BUCKET_NAME/config/config-$backup_time.tar.age \
  && echo "Done."

echo "Backing up database config..."
docker exec -i app-postgres-1 pg_dumpall -U postgres --roles-only \
  | age -r $CONFIG_FILE_AGE_PUBKEY \
  | AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    aws s3 cp - s3://$AWS_BACKUP_BUCKET_NAME/db-roles/roles-$backup_time.sql.age \
  && echo "Done."

echo "Backing up database data..."
docker exec -i app-postgres-1 pg_dump -U postgres \
  --exclude-table-data='logging.*' \
  --exclude-table-data='background_jobs' \
  --exclude-table-data='emails' \
  --exclude-table-data='timezone_areas' \
  | zstd -11 \
  | AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    aws s3 cp - s3://$AWS_BACKUP_BUCKET_NAME/db/dump-$backup_time.sql.zstd \
  && echo "Done."

echo "Backing up user media..."
sudo tar czf - data/media \
  | AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    aws s3 cp - s3://$AWS_BACKUP_BUCKET_NAME/media/media-$backup_time.tar.gz \
  && echo "Done."

popd
