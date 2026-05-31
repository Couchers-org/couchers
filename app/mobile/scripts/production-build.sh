#!/usr/bin/env bash
# Build the production store app on EAS when its fingerprint changes (build phase).
# Submitting the build to the stores happens separately in production-submit.sh
# (deploy phase). We emit the EAS build id and the fingerprint to a dotenv artifact
# so the submit job knows what to ship and which fingerprint to record on success.
#
# A signed OTA only applies to an installed build whose runtimeVersion (the Expo
# fingerprint) matches it, so when a native change moves the production fingerprint
# we cut a fresh store build; pure JS/TS changes ship over the air. We compare the
# fingerprint against the last-submitted marker in S3 and skip the build (leaving
# EAS_BUILD_ID empty) when it is unchanged.
#
# Usage: production-build.sh <ios|android>
# Env:   EXPO_TOKEN          EAS auth (build scope)
#        AWS_PREVIEW_BUCKET  the couchers-dev-assets bucket (holds the markers)
#        plus the AWS creds the aws CLI reads from the environment
# Run from app/mobile. Writes native-build-<platform>.env (a dotenv artifact).
set -euo pipefail

PLATFORM="${1:?usage: production-build.sh <ios|android>}"
case "$PLATFORM" in
  ios | android) ;;
  *)
    echo "platform must be ios or android (got $PLATFORM)" >&2
    exit 1
    ;;
esac

MARKER="s3://${AWS_PREVIEW_BUCKET}/production-builds/${PLATFORM}.fingerprint"
DOTENV="native-build-${PLATFORM}.env"

# Read a single JSON field from stdin with node (no jq in the node:22 image).
json_field() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(String(eval("j"+process.argv[1])??""))})' "$1"; }

# Fingerprint of the working tree — the same value EAS stamps as runtimeVersion
# and the OTA publish job bakes into the manifest. APP_VARIANT=production (set by
# the job) selects the production bundle id / scheme / signed updates config.
CURRENT="$(npx expo-updates fingerprint:generate --platform "$PLATFORM" 2>/dev/null | json_field '.hash')"
echo "current $PLATFORM fingerprint:        $CURRENT"

# The submit job records the marker once it succeeds, so hand it the fingerprint.
echo "EAS_FINGERPRINT=$CURRENT" > "$DOTENV"

PREVIOUS="$(aws s3 cp "$MARKER" - 2>/dev/null || true)"
echo "last-submitted $PLATFORM fingerprint: ${PREVIOUS:-<none>}"

# Set FORCE_NATIVE_BUILD_AND_SUBMIT to cut a fresh store build even when nothing
# native changed, so the store/TestFlight binary doesn't go stale behind OTA. The
# new build keeps the same runtimeVersion, so the live OTA bundle still applies;
# autoIncrement bumps the build number so nothing collides.
if [ "${FORCE_NATIVE_BUILD_AND_SUBMIT:-}" = "true" ]; then
  echo "FORCE_NATIVE_BUILD_AND_SUBMIT set — building a new $PLATFORM production app regardless of fingerprint."
elif [ -n "$PREVIOUS" ] && [ "$PREVIOUS" = "$CURRENT" ]; then
  echo "Fingerprint unchanged for $PLATFORM — the live production build still matches, skipping build."
  echo "EAS_BUILD_ID=" >> "$DOTENV"
  exit 0
else
  echo "Fingerprint changed for $PLATFORM — building a new production app on EAS."
fi

# EAS evaluates app.config.js and the native-build plugin on its own servers,
# which don't see this job's shell env, so the embedded version would fall back to
# "development". Bake the CI-computed version into a file the project carries up to
# EAS; app.config.js and withNativeBuildInfo.js read it. It's in .fingerprintignore
# (and only feeds `extra` + the generated plist/manifest), so it never affects the
# runtimeVersion — the embedded build and its OTA bundles stay on the same one.
if [ -n "${DISPLAY_VERSION:-}" ]; then
  printf '{"displayVersion":"%s","debugVersion":"%s"}\n' \
    "$DISPLAY_VERSION" "${DEBUG_VERSION:-}" > build-version.json
  echo "wrote build-version.json: $DISPLAY_VERSION / ${DEBUG_VERSION:-}"
fi

BUILD_JSON="$(eas build --platform "$PLATFORM" --profile production --non-interactive --json)"
BUILD_ID="$(printf '%s' "$BUILD_JSON" | json_field '[0].id')"
[ -n "$BUILD_ID" ] || {
  echo "could not determine the EAS build id from the build output" >&2
  exit 1
}
# `eas build` exits 0 even when the build ends up canceled or errored, so check
# the terminal status ourselves; otherwise a failed build would still write the
# dotenv and let the submit job ship nothing. Normalize case in case the CLI
# returns FINISHED rather than finished.
BUILD_STATUS="$(printf '%s' "$BUILD_JSON" | json_field '[0].status' | tr '[:upper:]' '[:lower:]')"
if [ "$BUILD_STATUS" != "finished" ]; then
  echo "EAS build $BUILD_ID did not finish (status: ${BUILD_STATUS:-unknown})" >&2
  exit 1
fi
echo "EAS_BUILD_ID=$BUILD_ID" >> "$DOTENV"
echo "Built $PLATFORM production app: $BUILD_ID"
