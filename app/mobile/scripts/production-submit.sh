#!/usr/bin/env bash
# Submit a production store app build to the stores (deploy phase). Reads the EAS
# build id and fingerprint that production-build.sh emitted into the dotenv
# artifact; an empty build id means the build was skipped (fingerprint unchanged)
# and there is nothing to submit. The fingerprint marker is recorded only after a
# successful submit, so a failed submit is retried (rebuilt) on the next pipeline.
#
#   iOS:     eas submit -> App Store Connect. The build lands in TestFlight and as
#            an available build; it is NOT submitted for App Store review and no
#            release notes change — do that by hand in App Store Connect.
#   Android: eas submit -> the Play *internal* testing track (the `production`
#            submit profile sets track: internal). Promote to the public production
#            track by hand in the Play Console.
#
# Neither platform makes anything public on its own.
#
# Usage: production-submit.sh <ios|android>
# Env:   EXPO_TOKEN          EAS auth (submit scope)
#        EAS_BUILD_ID        from the build job's dotenv (empty => nothing to submit)
#        EAS_FINGERPRINT     from the build job's dotenv (recorded on success)
#        AWS_PREVIEW_BUCKET  the couchers-dev-assets bucket (holds the markers)
#        plus the AWS creds the aws CLI reads from the environment
# Run from app/mobile (eas.json must be present).
set -euo pipefail

PLATFORM="${1:?usage: production-submit.sh <ios|android>}"
case "$PLATFORM" in
  ios | android) ;;
  *)
    echo "platform must be ios or android (got $PLATFORM)" >&2
    exit 1
    ;;
esac

if [ -z "${EAS_BUILD_ID:-}" ]; then
  echo "No new $PLATFORM build (fingerprint unchanged) — nothing to submit."
  exit 0
fi

echo "Submitting $PLATFORM build $EAS_BUILD_ID."
eas submit --platform "$PLATFORM" --profile production --id "$EAS_BUILD_ID" --non-interactive

# Record the fingerprint only after a successful submit, so a failure is retried on
# the next pipeline instead of being marked done.
MARKER="s3://${AWS_PREVIEW_BUCKET}/production-builds/${PLATFORM}.fingerprint"
printf '%s' "$EAS_FINGERPRINT" | aws s3 cp - "$MARKER"
echo "Recorded $PLATFORM fingerprint $EAS_FINGERPRINT — production build is up to date."
