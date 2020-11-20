#!/bin/bash

set -e

# we need the following vars from this .env file:
# - DATABASE_CONNECTION_STRING
# - AWS_BACKUP_BUCKET_NAME
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
source ../backup.prod.env

# --net=host is required so we can hit localhost from inside the container
docker run --net=host postgis/postgis:13-3.0 pg_dump $DATABASE_CONNECTION_STRING | aws s3 cp - s3://$AWS_BACKUP_BUCKET_NAME/dump-$(date +%s).sql
