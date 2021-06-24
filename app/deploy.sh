#!/bin/bash

AWS_PROFILE=couchers

AWS_S3_BUCKET_NAME=app.couchers.org
AWS_CF_DISTRIBUTION_ID=E2PHSPAI260AGQ

echo "Deploying frontend..."
folder=deploy-$(date +%s)
mkdir -p data/$folder
pushd data/$folder
curl -Lo artifacts.zip "https://gitlab.com/couchers/couchers/-/jobs/artifacts/develop/download?job=build:frontend"
unzip artifacts.zip
echo "Syncing S3"
aws s3 sync artifacts/frontend/ s3://$AWS_S3_BUCKET_NAME --delete --acl public-read

echo "Creating invalidation"
aws cloudfront create-invalidation --distribution-id $AWS_CF_DISTRIBUTION_ID --paths "/*"
popd
echo "Done."

ssh couchers "cd ~/couchers/app/deployment && ./upgrade.sh"
