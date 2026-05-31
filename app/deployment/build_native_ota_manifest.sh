#!/bin/sh
#
# Builds a native OTA deployment manifest JSON file.
#
# This is the mobile over-the-air counterpart to build_manifest.sh, kept on its
# OWN manifest stream (deploy/native-ota-manifests/) and produced/uploaded
# independently of the backend/web release, so a JS-only OTA can be published
# without a platform deploy. It records the per-platform bundle tarballs that
# build:mobile-ota-prod produced and preview:mobile-ota-prod uploaded to the
# preview CDN. The tools/ publish_native_ota lambda later pulls a chosen
# manifest, signs the bundle's Expo manifest, and pushes it to the prod CDN.
#
# Expected environment variables (set by GitLab CI and default before_script):
#   CI_COMMIT_SHA, CI_COMMIT_SHORT_SHA, CI_COMMIT_REF_NAME, CI_COMMIT_TIMESTAMP,
#   CI_PIPELINE_ID, SLUG, COMMIT_NUMBER, DISPLAY_VERSION, PREVIEW_DOMAIN
#
# Usage:
#   build_native_ota_manifest.sh <output_dir>
#
# Output:
#   <output_dir>/deploy/native-ota-manifests/<padded_commit_number>-<short_sha>.json

set -eu

OUTPUT_DIR="$1"

PADDED=$(printf "%06d" "$COMMIT_NUMBER")
MANIFEST_KEY="deploy/native-ota-manifests/${PADDED}-${CI_COMMIT_SHORT_SHA}.json"
OUTPUT_PATH="${OUTPUT_DIR}/${MANIFEST_KEY}"

mkdir -p "$(dirname "$OUTPUT_PATH")"

BASE="https://${CI_COMMIT_SHORT_SHA}--native-ota.${PREVIEW_DOMAIN}"

# Descriptive, immutable release name the publish step uses as the CDN path
# segment, e.g. v1.2.18355.fc38c23d — the release display version (app/version
# + commit number) plus the short commit hash. Built from clean components so it
# keeps this form regardless of which branch the bundle was built on.
OTA_VERSION="$(cat app/version).${COMMIT_NUMBER}.${CI_COMMIT_SHORT_SHA}"

cat > "$OUTPUT_PATH" <<EOF
{
  "commit_sha": "${CI_COMMIT_SHA}",
  "commit_short_sha": "${CI_COMMIT_SHORT_SHA}",
  "commit_number": ${COMMIT_NUMBER},
  "slug": "${SLUG}",
  "display_version": "${DISPLAY_VERSION}",
  "ota_version": "${OTA_VERSION}",
  "branch": "${CI_COMMIT_REF_NAME}",
  "timestamp": "${CI_COMMIT_TIMESTAMP}",
  "pipeline_id": "${CI_PIPELINE_ID}",
  "native_ota": {
    "ios": "${BASE}/native-ota-ios-${CI_PIPELINE_ID}-${CI_COMMIT_SHA}.tar.gz",
    "android": "${BASE}/native-ota-android-${CI_PIPELINE_ID}-${CI_COMMIT_SHA}.tar.gz"
  }
}
EOF

cat "$OUTPUT_PATH"
echo ""
echo "Written to $OUTPUT_PATH"
