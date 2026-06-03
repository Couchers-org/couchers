#!/usr/bin/env bash
# Rebuild the Couchers Dev Tool native client on EAS when its fingerprint changes.
#
# The Dev Tool dev client only needs a fresh native build when the Expo
# fingerprint (runtimeVersion) changes — a new native module, an app.config.js
# change, or an Expo SDK bump. Pure JS/TS changes load over the air (see
# docs/mobile-dev-tool-ota.md), so this no-ops on them. The current fingerprint
# is read from app/mobile/fingerprints.json (verified on every branch by
# test:mobile-fingerprints) and compared against the same file at the previous
# develop commit; on a change we build a fresh client.
#
#   iOS:     eas build --auto-submit -> TestFlight (Apple's tester channel).
#   Android: eas build -> a sideloadable APK we host ourselves. Google Play has no
#            TestFlight-equivalent for a dev-client APK (Play distributes AABs
#            through release tracks, not downloadable installers), so we publish
#            the APK to the dev-assets bucket at a stable URL devs bookmark.
#
# Usage: devtool-build.sh <ios|android>
# Env:   EXPO_TOKEN             EAS auth (build + submit scope)
#        AWS_PREVIEW_BUCKET     the couchers-dev-assets bucket (hosts the APK)
#        PREVIEW_DOMAIN         the dev-assets CDN domain (preview.couchershq.org)
#        CI_COMMIT_SHORT_SHA    tags the immutable APK filename
#        CI_COMMIT_BEFORE_SHA   GitLab-provided previous HEAD; reads prior file
#        plus the AWS creds the aws CLI reads from the environment
# Run from app/mobile (eas.json, the project, and node_modules must be present).
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

# Read a single JSON field from stdin with node (no jq in the node:22 image).
json_field() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(String(eval("j"+process.argv[1])??""))})' "$1"; }

# Read the (variant, platform) fingerprint out of a fingerprints.json blob on
# stdin. Prints empty when the blob is empty or the entry is missing.
read_fp() {
  node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{if(!s){process.stdout.write("");return}try{const j=JSON.parse(s);process.stdout.write(String(j?.[process.argv[1]]?.[process.argv[2]]??""))}catch{process.stdout.write("")}})' "$VARIANT" "$PLATFORM"
}

# Current fingerprint comes from the committed file at HEAD. The
# test:mobile-fingerprints job verifies on every branch that this value matches
# what `npx expo-updates fingerprint:generate` produces, so we trust it here.
CURRENT="$(read_fp < fingerprints.json)"
[ -n "$CURRENT" ] || {
  echo "Missing fingerprint for $VARIANT/$PLATFORM in app/mobile/fingerprints.json" >&2
  exit 1
}
echo "current $PLATFORM fingerprint:  $CURRENT"

# Previous fingerprint comes from fingerprints.json at CI_COMMIT_BEFORE_SHA.
# Missing file at the previous commit means this is the migration commit that
# first introduced fingerprints.json, where the file should reflect what's
# already deployed — treat as unchanged.
PREVIOUS=""
PREV_FILE_PRESENT=false
if [ -n "${CI_COMMIT_BEFORE_SHA:-}" ] && [ "${CI_COMMIT_BEFORE_SHA}" != "0000000000000000000000000000000000000000" ]; then
  PREV_JSON="$(git show "${CI_COMMIT_BEFORE_SHA}:app/mobile/fingerprints.json" 2>/dev/null || true)"
  if [ -n "$PREV_JSON" ]; then
    PREV_FILE_PRESENT=true
    PREVIOUS="$(printf '%s' "$PREV_JSON" | read_fp)"
  fi
fi
echo "previous $PLATFORM fingerprint: ${PREVIOUS:-<none>}"

if [ "$PREV_FILE_PRESENT" = "false" ]; then
  echo "fingerprints.json wasn't present at the previous develop commit — treating as unchanged (migration)."
  exit 0
fi
if [ "$PREVIOUS" = "$CURRENT" ]; then
  echo "Fingerprint unchanged for $PLATFORM — installed Dev Tool client still current, skipping build."
  exit 0
fi

echo "Fingerprint changed for $PLATFORM — building a new Dev Tool client."

if [ "$PLATFORM" = "ios" ]; then
  # Store distribution + auto-submit lands the build in TestFlight; devs update there.
  eas build --platform ios --profile devtool --auto-submit --non-interactive
else
  # devtool-apk: internal-distribution APK dev client (extends devtool). Not
  # submitted anywhere — we download the artifact and host it ourselves.
  BUILD_JSON="$(eas build --platform android --profile devtool-apk --non-interactive --json)"
  APK_URL="$(printf '%s' "$BUILD_JSON" | json_field '[0].artifacts.applicationArchiveUrl')"
  [ -n "$APK_URL" ] || {
    echo "could not find the APK artifact URL in the eas build output" >&2
    exit 1
  }
  echo "APK artifact: $APK_URL"
  curl -fSL "$APK_URL" -o couchers-devtool.apk

  # Immutable per-commit APK (cache forever, no CDN invalidation — matching the OTA
  # infra), plus a stable landing page devs bookmark that links to the current one.
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
