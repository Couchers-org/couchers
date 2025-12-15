#!/bin/bash
set -e

export AWS_PROFILE=couchers

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

rev=$(git rev-parse @ | cut -c-8)
echo "Git hash is $rev"

workdir=$(mktemp -d)
pushd $workdir

### NEXT
echo "Checking next: https://next.couchershq.org"

"$SCRIPT_DIR"/check_deployment.sh "develop-$rev" "https://next.couchershq.org"
VERIFICATION_STATUS=$?

if [ "$VERIFICATION_STATUS" -ne 0 ]; then
    exit 1
fi

### PROD
echo "Deploying to prod..."
web_static="https://$rev--web-static.preview.couchershq.org/static.tar.gz"
wget $web_static -O static.tar.gz
mkdir -p static/
tar xf static.tar.gz --directory static/
aws s3 sync static/ s3://cdn.couchers.org/static/_next/static/
ssh couchers2 "cd ~/couchers/app/deployment && ./upgrade.sh"
echo "Done deploying prod, should be live at https://couchers.org"

"$SCRIPT_DIR"/check_deployment.sh "develop-$rev" "https://couchers.org"
VERIFICATION_STATUS=$?

if [ "$VERIFICATION_STATUS" -ne 0 ]; then
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo "!!!                                                      !!!"
    echo "!!!   PROD DEPLOYMENT VERIFICATION FAILED. ABORTING.     !!!"
    echo "!!!                                                      !!!"
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    exit 1
fi

echo "Deployed, all OK."
