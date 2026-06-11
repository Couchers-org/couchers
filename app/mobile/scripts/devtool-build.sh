#!/usr/bin/env bash
# Rebuild the Dev Tool native client on EAS when its fingerprint changes.
# Usage: devtool-build.sh <ios|android>  (run from app/mobile)
# Env:   EXPO_TOKEN             EAS auth (build + submit scope)
#        AWS_PREVIEW_BUCKET     the couchers-dev-assets bucket (hosts the APK)
#        PREVIEW_DOMAIN         the dev-assets CDN domain (preview.couchershq.org)
#        CI_COMMIT_SHORT_SHA    tags the immutable APK filename
#        CI_COMMIT_BEFORE_SHA   GitLab-provided previous HEAD; reads prior file
#        plus the AWS creds the aws CLI reads from the environment
set -euo pipefail

PLATFORM="${1:?usage: devtool-build.sh <ios|android>}"
case "$PLATFORM" in
  ios | android) ;;
  *)
    echo "platform must be ios or android (got $PLATFORM)" >&2
    exit 1
    ;;
esac

VARIANT=devtool

# node, not jq — the node:22 image has no jq.
json_field() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(String(eval("j"+process.argv[1])??""))})' "$1"; }

read_fp() { grep -m1 "^${VARIANT}/${PLATFORM}=" | cut -d= -f2-; }

CURRENT="$(read_fp < fingerprints)"
[ -n "$CURRENT" ] || {
  echo "Missing fingerprint for $VARIANT/$PLATFORM in app/mobile/fingerprints" >&2
  exit 1
}
echo "current $PLATFORM fingerprint:  $CURRENT"

# A missing file at the previous commit is the migration commit that introduced
# fingerprints — treat as unchanged.
PREVIOUS=""
PREV_FILE_PRESENT=false
if [ -n "${CI_COMMIT_BEFORE_SHA:-}" ] && [ "${CI_COMMIT_BEFORE_SHA}" != "0000000000000000000000000000000000000000" ]; then
  PREV_BLOB="$(git show "${CI_COMMIT_BEFORE_SHA}:app/mobile/fingerprints" 2>/dev/null || true)"
  if [ -n "$PREV_BLOB" ]; then
    PREV_FILE_PRESENT=true
    PREVIOUS="$(printf '%s' "$PREV_BLOB" | read_fp)"
  fi
fi
echo "previous $PLATFORM fingerprint: ${PREVIOUS:-<none>}"

if [ "${FORCE_NATIVE_BUILD_AND_SUBMIT:-}" = "true" ] || [ "${FORCE_NATIVE_DEVTOOL_BUILD_AND_SUBMIT:-}" = "true" ]; then
  echo "Force flag set — building a new Dev Tool $PLATFORM client regardless of fingerprint."
elif [ "$PREV_FILE_PRESENT" = "false" ]; then
  echo "fingerprints file wasn't present at the previous develop commit — treating as unchanged (migration). Set FORCE_NATIVE_BUILD_AND_SUBMIT or FORCE_NATIVE_DEVTOOL_BUILD_AND_SUBMIT to override."
  exit 0
elif [ "$PREVIOUS" = "$CURRENT" ]; then
  echo "Fingerprint unchanged for $PLATFORM — installed Dev Tool client still current, skipping build."
  exit 0
else
  echo "Fingerprint changed for $PLATFORM — building a new Dev Tool client."
fi

if [ "$PLATFORM" = "ios" ]; then
  eas build --platform ios --profile devtool --auto-submit --non-interactive
else
  # No Play TestFlight-equivalent for a dev-client APK, so we host it ourselves.
  BUILD_JSON="$(eas build --platform android --profile devtool-apk --non-interactive --json)"
  APK_URL="$(printf '%s' "$BUILD_JSON" | json_field '[0].artifacts.applicationArchiveUrl')"
  [ -n "$APK_URL" ] || {
    echo "could not find the APK artifact URL in the eas build output" >&2
    exit 1
  }
  echo "APK artifact: $APK_URL"
  curl -fSL "$APK_URL" -o couchers-devtool.apk

  PREFIX="devtool-builds/android"
  APK_NAME="couchers-devtool-${CI_COMMIT_SHORT_SHA}.apk"
  HOST="android--devtool-builds.${PREVIEW_DOMAIN}"
  aws s3 cp couchers-devtool.apk "s3://${AWS_PREVIEW_BUCKET}/${PREFIX}/${APK_NAME}" \
    --content-type application/vnd.android.package-archive

  cat > index.html <<HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Couchers Dev Tool — Android</title>
</head>
<body style="font-family: sans-serif; max-width: 32rem; margin: 3rem auto; padding: 0 1rem">
<h1>Couchers Dev Tool (Android)</h1>
<p><a href="./${APK_NAME}" style="font-size: 1.25rem">Download the latest APK</a></p>
<p>Built from commit <code>${CI_COMMIT_SHORT_SHA}</code>. Enable "install from unknown
sources" to sideload. Re-open this page to grab newer builds.</p>
<p>iOS testers: the Dev Tool ships through TestFlight, not here.</p>
</body>
</html>
HTML
  # Stable pointer — overwritten each build, so revalidate rather than cache.
  aws s3 cp index.html "s3://${AWS_PREVIEW_BUCKET}/${PREFIX}/index.html" \
    --content-type "text/html; charset=utf-8" --cache-control "no-cache"
  echo "APK published: https://${HOST}/${APK_NAME}"
  echo "Stable page:   https://${HOST}/index.html"
fi

echo "Built Dev Tool $PLATFORM client at fingerprint $CURRENT."
