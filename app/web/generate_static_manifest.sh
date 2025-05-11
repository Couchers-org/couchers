#!/bin/sh
set -e

# We put the static files generates by NextJS onto a CDN, which speeds up their delivery. This file generates a
# "manifest" that describes the contents of a "package" of static files to be uploaded to the CDN. The manifests can
# then be used to figure out what files can be deleted and if NextJS is actually generating true immutable files.

# Takes one input, the folder to run in, produces output to STDOUT

cd $1

echo "Web static manifest v1 for pipeline ID $CI_PIPELINE_ID"
echo "Pipeline ID: $CI_PIPELINE_ID"
echo "Job ID: $CI_JOB_ID"
echo "Job name: $CI_JOB_NAME"
echo "Job time: $CI_JOB_STARTED_AT"
echo "Display version: $DISPLAY_VERSION"
echo "Commit SHA: $CI_COMMIT_SHA"
echo "Commit time: $CI_COMMIT_TIMESTAMP"
echo "Files:"
echo
echo
find . -type f -exec sha256sum '{}' \; | sort -k2
