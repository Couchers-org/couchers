#!/usr/bin/env bash
# Build the store app for a release variant (staging or production) on EAS when its
# fingerprint changes (build phase). Submitting the build to the stores happens
# separately in native-submit.sh (deploy phase). We emit the EAS build id and the
# fingerprint to a dotenv artifact so the submit job knows what to ship and which
# fingerprint to record on success.
#
# A signed OTA only applies to an installed build whose runtimeVersion (the Expo
# fingerprint) matches it, so when a native change moves the variant's fingerprint
# we cut a fresh store build; pure JS/TS changes ship over the air. We compare the
# fingerprint against the last-submitted marker in S3 and skip the build (leaving
# EAS_BUILD_ID empty) when it is unchanged.
#
# Usage: native-build.sh <ios|android>
# Env:   APP_VARIANT         staging | production — selects the bundle id / scheme /
#                            signed updates config and the eas.json build profile
#        EXPO_TOKEN          EAS auth (build scope)
#        AWS_PREVIEW_BUCKET  the couchers-dev-assets bucket (holds the markers)
#        plus the AWS creds the aws CLI reads from the environment
# Run from app/mobile. Writes native-build-<platform>.env (a dotenv artifact).
set -euo pipefail

PLATFORM="${1:?usage: native-build.sh <ios|android>}"
case "$PLATFORM" in
  ios | android) ;;
  *)
    echo "platform must be ios or android (got $PLATFORM)" >&2
    exit 1
    ;;
esac

VARIANT="${APP_VARIANT:?APP_VARIANT must be set (staging or production)}"
case "$VARIANT" in
  staging | production) ;;
  *)
    echo "APP_VARIANT must be staging or production (got $VARIANT)" >&2
    exit 1
    ;;
esac

# Separate marker per variant so staging and production track their store builds
# independently; the eas.json build profile is named after the variant.
MARKER="s3://${AWS_PREVIEW_BUCKET}/${VARIANT}-builds/${PLATFORM}.fingerprint"
DOTENV="native-build-${PLATFORM}.env"

# Read a single JSON field from stdin with node (no jq in the node:22 image).
json_field() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(String(eval("j"+process.argv[1])??""))})' "$1"; }

# Fingerprint of the working tree — the same value EAS stamps as runtimeVersion
# and the OTA publish job bakes into the manifest. APP_VARIANT (set by the job)
# selects the variant's bundle id / scheme / signed updates config.
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
  echo "FORCE_NATIVE_BUILD_AND_SUBMIT set — building a new $PLATFORM $VARIANT app regardless of fingerprint."
elif [ -n "$PREVIOUS" ] && [ "$PREVIOUS" = "$CURRENT" ]; then
  echo "Fingerprint unchanged for $PLATFORM — the live $VARIANT build still matches, skipping build."
  echo "EAS_BUILD_ID=" >> "$DOTENV"
  exit 0
else
  echo "Fingerprint changed for $PLATFORM — building a new $VARIANT app on EAS."
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

BUILD_JSON="$(eas build --platform "$PLATFORM" --profile "$VARIANT" --non-interactive --json)"
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
echo "Built $PLATFORM $VARIANT app: $BUILD_ID"
