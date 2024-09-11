#!/bin/bash

set -e

pushd ..

# we need the following vars from this .env file:
# - SLACK_DEPLOY_WEBHOOK_URL
source webhook.prod.env

branch=$(git symbolic-ref --short HEAD)
branch_url=https://github.com/Couchers-org/couchers/tree/$branch
git_hash=$(git rev-parse --short @)
commit_url=https://github.com/Couchers-org/couchers/commit/$(git rev-parse @)

git_status=dirty
if [ -z "$(git status --porcelain)" ]; then
  git_status=clean
fi

message="Deployed <$branch_url|$branch> @ <$commit_url|$git_hash> ($git_status) to prod."
data="{\"blocks\":[{\"type\":\"section\",\"text\":{\"type\":\"mrkdwn\",\"text\":\"${message}\"}}]}"
curl -X POST -H 'Content-type: application/json' --data "$data" $SLACK_DEPLOY_WEBHOOK_URL

popd
