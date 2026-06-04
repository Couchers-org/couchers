#!/usr/bin/env bash
# Build the store app for a release variant (staging or production) on EAS when
# its fingerprint changes (build phase). Submitting the build to the stores
# happens separately in native-submit.sh (deploy phase). We emit the EAS build id
# and the fingerprint to a dotenv artifact so the submit job knows what to ship.
#
# A signed OTA only applies to an installed build whose runtimeVersion (the Expo
# fingerprint) matches it, so when a native change moves the variant's
# fingerprint we cut a fresh store build; pure JS/TS changes ship over the air.
# Fingerprints are pinned in app/mobile/fingerprints (verified on every branch
# by test:mobile-fingerprints), so this job just compares the file's value at
# HEAD against its value at the previous develop commit to decide whether to
# build. No build → EAS_BUILD_ID is left empty so submit becomes a no-op.
#
# Usage: native-build.sh <ios|android>
# Env:   APP_VARIANT             staging | production — selects the bundle id /
#                                scheme / signed updates config and the eas.json
#                                build profile and the matching entry in the
#                                fingerprints file
#        EXPO_TOKEN              EAS auth (build scope)
#        CI_COMMIT_BEFORE_SHA    GitLab-provided previous HEAD on this branch;
#                                used to read the prior fingerprints file
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

DOTENV="native-build-${PLATFORM}.env"

# Read a single JSON field from stdin with node (no jq in the node:22 image).
json_field() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(String(eval("j"+process.argv[1])??""))})' "$1"; }

# Read the (variant, platform) fingerprint out of an `app/mobile/fingerprints`
# blob on stdin. The file is one `variant/platform=hash` line per entry; print
# the first matching value, empty when missing.
read_fp() { grep -m1 "^${VARIANT}/${PLATFORM}=" | cut -d= -f2-; }

# Current fingerprint comes from the committed file at HEAD. The
# test:mobile-fingerprints job verifies on every branch that this value matches
# what `npx expo-updates fingerprint:generate` produces, so we trust it here.
CURRENT="$(read_fp < fingerprints)"
[ -n "$CURRENT" ] || {
  echo "Missing fingerprint for $VARIANT/$PLATFORM in app/mobile/fingerprints" >&2
  exit 1
}
echo "current $VARIANT/$PLATFORM fingerprint:  $CURRENT"

# Previous fingerprint comes from the same file at CI_COMMIT_BEFORE_SHA — the
# develop HEAD before this push. We compare against the prior file rather than
# re-running fingerprint:generate so the decision is based purely on the
# committed value (the test:mobile-fingerprints job guarantees the file matches
# the actual fingerprint on every branch). PREV_FILE_PRESENT lets us tell apart
# "file existed but the entry is missing" (new variant — build) from "file
# didn't exist yet" (the migration commit that introduced the file — don't
# rebuild, since the file should reflect what's already deployed).
PREVIOUS=""
PREV_FILE_PRESENT=false
if [ -n "${CI_COMMIT_BEFORE_SHA:-}" ] && [ "${CI_COMMIT_BEFORE_SHA}" != "0000000000000000000000000000000000000000" ]; then
  PREV_BLOB="$(git show "${CI_COMMIT_BEFORE_SHA}:app/mobile/fingerprints" 2>/dev/null || true)"
  if [ -n "$PREV_BLOB" ]; then
    PREV_FILE_PRESENT=true
    PREVIOUS="$(printf '%s' "$PREV_BLOB" | read_fp)"
  fi
fi
echo "previous $VARIANT/$PLATFORM fingerprint: ${PREVIOUS:-<none>}"

# Hand the fingerprint to the submit job so it logs what it shipped.
echo "EAS_FINGERPRINT=$CURRENT" > "$DOTENV"

# Set FORCE_NATIVE_BUILD_AND_SUBMIT to cut a fresh store build even when nothing
# native changed, so the store/TestFlight binary doesn't go stale behind OTA. The
# new build keeps the same runtimeVersion, so the live OTA bundle still applies;
# autoIncrement bumps the build number so nothing collides.
if [ "${FORCE_NATIVE_BUILD_AND_SUBMIT:-}" = "true" ]; then
  echo "FORCE_NATIVE_BUILD_AND_SUBMIT set — building a new $PLATFORM $VARIANT app regardless of fingerprint."
elif [ "$PREV_FILE_PRESENT" = "false" ]; then
  echo "fingerprints file wasn't present at the previous develop commit — treating as unchanged (migration). Use FORCE_NATIVE_BUILD_AND_SUBMIT to override."
  echo "EAS_BUILD_ID=" >> "$DOTENV"
  exit 0
elif [ "$PREVIOUS" = "$CURRENT" ]; then
  echo "Fingerprint unchanged for $VARIANT/$PLATFORM — the live build still matches, skipping build."
  echo "EAS_BUILD_ID=" >> "$DOTENV"
  exit 0
else
  echo "Fingerprint changed for $VARIANT/$PLATFORM — building a new app on EAS."
fi

# EAS evaluates app.config.js and the native-build plugin on its own servers,
# which don't see this job's shell env, so the embedded version would fall back
# to "development". Bake the CI-computed version into a file the project carries
# up to EAS; app.config.js and withNativeBuildInfo.js read it. It's in
# .fingerprintignore (and only feeds `extra` + the generated plist/manifest), so
# it never affects the runtimeVersion — the embedded build and its OTA bundles
# stay on the same one.
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
