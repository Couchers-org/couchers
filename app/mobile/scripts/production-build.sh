#!/usr/bin/env bash
# Rebuild and submit the production store app on EAS when its fingerprint changes.
#
# A signed OTA only applies to an installed build whose runtimeVersion (the Expo
# fingerprint) matches it. So when a native change moves the production
# fingerprint — a new native module, an app.config.js change, or an Expo SDK bump
# — we need a fresh store build carrying it before an OTA on that fingerprint can
# land; pure JS/TS changes ship over the air. We record the last-built fingerprint
# per platform in S3 and compare; on a change we build and auto-submit, recording
# the marker only once that succeeds so a failed build is retried.
#
#   iOS:     eas build --auto-submit -> App Store Connect. The build lands in
#            TestFlight and as an available build; it is NOT submitted for App
#            Store review and no release notes are changed — do that by hand.
#   Android: eas build --auto-submit -> the Play *internal* testing track (the
#            `production` submit profile sets track: internal). Promote to the
#            public production track by hand in the Play Console.
#
# Neither platform makes anything public on its own.
#
# Usage: production-build.sh <ios|android>
# Env:   EXPO_TOKEN          EAS auth (build + submit scope)
#        AWS_PREVIEW_BUCKET  the couchers-dev-assets bucket (holds the markers)
#        plus the AWS creds the aws CLI reads from the environment
# Run from app/mobile (eas.json, the project, and node_modules must be present).
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

# Read a single JSON field from stdin with node (no jq in the node:22 image).
json_field() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(String(eval("j"+process.argv[1])??""))})' "$1"; }

# Fingerprint of the working tree — the same value EAS stamps as runtimeVersion
# and the OTA publish job bakes into the manifest. APP_VARIANT=production (set by
# the job) selects the production bundle id / scheme / signed updates config.
CURRENT="$(npx expo-updates fingerprint:generate --platform "$PLATFORM" 2>/dev/null | json_field '.hash')"
echo "current $PLATFORM fingerprint:    $CURRENT"

PREVIOUS="$(aws s3 cp "$MARKER" - 2>/dev/null || true)"
echo "last-built $PLATFORM fingerprint: ${PREVIOUS:-<none>}"

if [ -n "$PREVIOUS" ] && [ "$PREVIOUS" = "$CURRENT" ]; then
  echo "Fingerprint unchanged for $PLATFORM — the live production build still matches, skipping."
  exit 0
fi

echo "Fingerprint changed for $PLATFORM — building and submitting a new production app."
# --auto-submit uses the submit profile named like the build profile (production):
# iOS -> App Store Connect, Android -> the internal track.
eas build --platform "$PLATFORM" --profile production --auto-submit --non-interactive

# Record the new fingerprint only after a successful build+submit, so a failure is
# retried on the next pipeline instead of being marked done.
printf '%s' "$CURRENT" | aws s3 cp - "$MARKER"
echo "Recorded $PLATFORM fingerprint $CURRENT — production build is up to date."
