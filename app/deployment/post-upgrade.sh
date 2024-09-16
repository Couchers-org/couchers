#!/bin/bash

set -e

pushd ..

# we need the following vars from this .env file:
# - SLACK_DEPLOY_WEBHOOK_URL
# - MAXMIND_AUTH_ID_SECRET
source post-upgrade.prod.env

popd

## Send a slack webhook

post_to_slack () {
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
  curl -sX POST -H 'Content-type: application/json' --data "$data" $SLACK_DEPLOY_WEBHOOK_URL
}

if [ -n "$SLACK_DEPLOY_WEBHOOK_URL" ]; then
  post_to_slack
else
  echo "Slack webhook URL not set, not posting to slack"
fi

## Update MMDB files

pushd ../data/aux

download_mmdb () {
  curl -sL --user $MAXMIND_AUTH_ID_SECRET "https://download.maxmind.com/geoip/databases/$1/download?suffix=tar.gz" | tar -zxO --wildcards '*.mmdb' > $2
}

possibly_update_mmdb () {
  echo "Checking last update for $1"
  destination=$1.mmdb
  if [ ! -e $destination ]; then
    echo "Didn't find $1, downloading"
    download_mmdb $1 $destination
  else
    mm_last_modified=$(curl --head -sL --user $MAXMIND_AUTH_ID_SECRET "https://download.maxmind.com/geoip/databases/$1/download?suffix=tar.gz" | grep 'last-modified' | cut -c 16- | date -f- '+%s')
    us_last_modified=$(date -r $destination "+%s")

    if (( mm_last_modified > us_last_modified )); then
      echo "$1 updated, downloading"
      download_mmdb $1 $destination
      echo "Done with $1"
    else
      echo "$1 is up to date"
    fi
  fi
}

sudo chown $(id -u):$(id -g) .

possibly_update_mmdb GeoLite2-City
possibly_update_mmdb GeoLite2-ASN
