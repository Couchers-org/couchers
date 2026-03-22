#!/bin/sh
#
# Builds a deployment manifest JSON file.
#
# The manifest describes a release: which commit it corresponds to, what the
# current alembic migration head is, and the Docker image tags for each service.
#
# Expected environment variables (set by GitLab CI and default before_script):
#   CI_COMMIT_SHA, CI_COMMIT_SHORT_SHA, CI_COMMIT_REF_NAME,
#   CI_COMMIT_TIMESTAMP, CI_PIPELINE_ID, CI_REGISTRY_IMAGE, SLUG,
#   COMMIT_NUMBER, DISPLAY_VERSION
#
# Usage:
#   build_manifest.sh <migrations_dir> <output_dir>
#
# Output:
#   <output_dir>/deploy/manifests/<padded_commit_number>-<short_sha>.json

set -eu

MIGRATIONS_DIR="$1"
OUTPUT_DIR="$2"

# Extract highest ordinal migration number
ALEMBIC_HEAD=$(ls "$MIGRATIONS_DIR" | grep -oE '^[0-9]{4}' | sort -n | tail -1)
if [ -z "$ALEMBIC_HEAD" ]; then
    echo "ERROR: No migrations found in $MIGRATIONS_DIR" >&2
    exit 1
fi

PADDED=$(printf "%06d" "$COMMIT_NUMBER")
MANIFEST_KEY="deploy/manifests/${PADDED}-${CI_COMMIT_SHORT_SHA}.json"
OUTPUT_PATH="${OUTPUT_DIR}/${MANIFEST_KEY}"

mkdir -p "$(dirname "$OUTPUT_PATH")"

cat > "$OUTPUT_PATH" <<EOF
{
  "commit_sha": "${CI_COMMIT_SHA}",
  "commit_short_sha": "${CI_COMMIT_SHORT_SHA}",
  "commit_number": ${COMMIT_NUMBER},
  "slug": "${SLUG}",
  "display_version": "${DISPLAY_VERSION}",
  "branch": "${CI_COMMIT_REF_NAME}",
  "timestamp": "${CI_COMMIT_TIMESTAMP}",
  "alembic_head": "${ALEMBIC_HEAD}",
  "pipeline_id": "${CI_PIPELINE_ID}",
  "images": {
    "backend": "${CI_REGISTRY_IMAGE}/backend:${SLUG}",
    "media": "${CI_REGISTRY_IMAGE}/media:${SLUG}",
    "web": "${CI_REGISTRY_IMAGE}/web:${SLUG}",
    "proxy": "${CI_REGISTRY_IMAGE}/proxy:${SLUG}",
    "nginx": "${CI_REGISTRY_IMAGE}/nginx:${SLUG}",
    "prometheus": "${CI_REGISTRY_IMAGE}/prometheus:${SLUG}"
  },
  "static": {
    "web": "static-${CI_PIPELINE_ID}-${CI_COMMIT_SHA}.tar.gz",
    "web_next": "static-${CI_PIPELINE_ID}-${CI_COMMIT_SHA}.tar.gz"
  }
}
EOF

cat "$OUTPUT_PATH"
echo ""
echo "Written to $OUTPUT_PATH"
