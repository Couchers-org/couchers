#!/usr/bin/env bash
# Submit a staging/production build to the stores, reading the EAS build id from
# native-build.sh's dotenv (empty id => build skipped, nothing to submit).
# Neither platform makes anything public on its own (iOS → TestFlight, Android →
# Play internal track); promote to public by hand.
# Usage: native-submit.sh <ios|android>  (APP_VARIANT=staging|production, run from app/mobile)
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
