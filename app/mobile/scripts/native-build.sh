#!/usr/bin/env bash
# Build the staging/production store app on EAS when its fingerprint changes,
# emitting the build id + fingerprint to a dotenv for native-submit.sh.
# Usage: native-build.sh <ios|android>  (run from app/mobile)
# Env:   APP_VARIANT             staging | production — selects the bundle id /
#                                scheme / signed updates config and the eas.json
#                                build profile and the matching fingerprints entry
#        EXPO_TOKEN              EAS auth (build scope)
#        CI_COMMIT_BEFORE_SHA    GitLab-provided previous HEAD on this branch;
#                                used to read the prior fingerprints file
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

# node, not jq — the node:22 image has no jq.
json_field() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(String(eval("j"+process.argv[1])??""))})' "$1"; }

read_fp() { grep -m1 "^${VARIANT}/${PLATFORM}=" | cut -d= -f2-; }

CURRENT="$(read_fp < fingerprints)"
[ -n "$CURRENT" ] || {
  echo "Missing fingerprint for $VARIANT/$PLATFORM in app/mobile/fingerprints" >&2
  exit 1
}
echo "current $VARIANT/$PLATFORM fingerprint:  $CURRENT"

# PREV_FILE_PRESENT distinguishes "entry missing from an existing file" (new
# variant — build) from "file absent" (the migration commit — don't rebuild).
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

echo "EAS_FINGERPRINT=$CURRENT" > "$DOTENV"

# FORCE_NATIVE_BUILD_AND_SUBMIT cuts a fresh build even when nothing native
# changed, so the store binary doesn't go stale behind OTA.
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

# EAS evaluates app.config.js on its own servers without this job's shell env,
# so bake the CI-computed version into a file the project carries up. It's in
# .fingerprintignore, so it never affects the runtimeVersion.
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
# `eas build` exits 0 even when the build is canceled or errored, so check the
# terminal status ourselves.
BUILD_STATUS="$(printf '%s' "$BUILD_JSON" | json_field '[0].status' | tr '[:upper:]' '[:lower:]')"
if [ "$BUILD_STATUS" != "finished" ]; then
  echo "EAS build $BUILD_ID did not finish (status: ${BUILD_STATUS:-unknown})" >&2
  exit 1
fi
echo "EAS_BUILD_ID=$BUILD_ID" >> "$DOTENV"
echo "Built $PLATFORM $VARIANT app: $BUILD_ID"
