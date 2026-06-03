#!/usr/bin/env bash
# Submit a release variant's store app build (staging or production) to the
# stores (deploy phase). Reads the EAS build id and fingerprint that
# native-build.sh emitted into the dotenv artifact; an empty build id means the
# build was skipped (fingerprint unchanged) and there is nothing to submit. The
# fingerprint of record lives in app/mobile/fingerprints.json — nothing here
# writes it.
#
#   iOS:     eas submit -> App Store Connect. The build lands in TestFlight and as
#            an available build; it is NOT submitted for App Store review and no
#            release notes change — do that by hand in App Store Connect.
#   Android: eas submit -> the Play *internal* testing track (the submit profile
#            sets track: internal). Promote to the public production track by hand
#            in the Play Console.
#
# Neither platform makes anything public on its own.
#
# Usage: native-submit.sh <ios|android>
# Env:   APP_VARIANT      staging | production — selects the eas.json submit
#                         profile and the matching build's binary
#        EXPO_TOKEN       EAS auth (submit scope)
#        EAS_BUILD_ID     from the build job's dotenv (empty => nothing to submit)
#        EAS_FINGERPRINT  from the build job's dotenv (logged for traceability)
# Run from app/mobile (eas.json must be present).
set -euo pipefail

PLATFORM="${1:?usage: native-submit.sh <ios|android>}"
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

if [ -z "${EAS_BUILD_ID:-}" ]; then
  echo "No new $PLATFORM build (fingerprint unchanged) — nothing to submit."
  exit 0
fi

echo "Submitting $PLATFORM $VARIANT build $EAS_BUILD_ID (fingerprint ${EAS_FINGERPRINT:-unknown})."
eas submit --platform "$PLATFORM" --profile "$VARIANT" --id "$EAS_BUILD_ID" --non-interactive
echo "Submitted $PLATFORM $VARIANT build $EAS_BUILD_ID."
