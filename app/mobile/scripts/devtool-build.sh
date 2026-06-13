#!/usr/bin/env bash
# Rebuild the Dev Tool native client on EAS when its fingerprint changes.
# Usage: devtool-build.sh <ios|android|ios-sim>  (run from app/mobile)
#   ios      → device build, auto-submitted to TestFlight
#   android  → APK, self-hosted on the dev-assets bucket
#   ios-sim  → iOS Simulator build, self-hosted on the dev-assets bucket
# Env:   EXPO_TOKEN             EAS auth (build + submit scope)
#        AWS_PREVIEW_BUCKET     the couchers-dev-assets bucket (hosts the APK/sim build)
#        PREVIEW_DOMAIN         the dev-assets CDN domain (preview.couchershq.org)
#        CI_COMMIT_REF_SLUG     the branch slug (develop); the preview-subdomain ref
#        CI_COMMIT_SHORT_SHA    tags the immutable APK/sim filename
#        CI_COMMIT_BEFORE_SHA   GitLab-provided previous HEAD; reads prior file
#        plus the AWS creds the aws CLI reads from the environment
set -euo pipefail

TARGET="${1:?usage: devtool-build.sh <ios|android|ios-sim>}"
case "$TARGET" in
  ios | android | ios-sim) ;;
  *)
    echo "target must be ios, android, or ios-sim (got $TARGET)" >&2
    exit 1
    ;;
esac

VARIANT=devtool

# The iOS Simulator build shares the device build's native fingerprint — the
# `simulator` flag lives in eas.json, which is excluded from the runtime
# fingerprint — so gate ios-sim on the same `devtool/ios` entry.
case "$TARGET" in
  ios-sim) FP_PLATFORM=ios ;;
  *) FP_PLATFORM="$TARGET" ;;
esac

# Self-hosted client downloads (APK, simulator build) follow the preview-subdomain
# rewriter's {ref}--{artifact-type} convention: {ref}--devtool-builds maps to the
# bucket prefix devtool-builds/{ref}/, and each platform is a sub-path beneath it
# (mirrors the {sha}--ota/{platform} OTA layout). The ref is the branch slug
# (develop), so the URL is stable and bookmarkable across builds.
BUILDS_HOST="${CI_COMMIT_REF_SLUG}--devtool-builds.${PREVIEW_DOMAIN}"

# node, not jq — the node:22 image has no jq.
json_field() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(String(eval("j"+process.argv[1])??""))})' "$1"; }

read_fp() { grep -m1 "^${VARIANT}/${FP_PLATFORM}=" | cut -d= -f2-; }

CURRENT="$(read_fp < fingerprints)"
[ -n "$CURRENT" ] || {
  echo "Missing fingerprint for $VARIANT/$FP_PLATFORM in app/mobile/fingerprints" >&2
  exit 1
}
echo "current $FP_PLATFORM fingerprint:  $CURRENT"

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
echo "previous $FP_PLATFORM fingerprint: ${PREVIOUS:-<none>}"

if [ "${FORCE_NATIVE_BUILD_AND_SUBMIT:-}" = "true" ] || [ "${FORCE_NATIVE_DEVTOOL_BUILD_AND_SUBMIT:-}" = "true" ]; then
  echo "Force flag set — building a new Dev Tool $TARGET client regardless of fingerprint."
elif [ "$PREV_FILE_PRESENT" = "false" ]; then
  echo "fingerprints file wasn't present at the previous develop commit — treating as unchanged (migration). Set FORCE_NATIVE_BUILD_AND_SUBMIT or FORCE_NATIVE_DEVTOOL_BUILD_AND_SUBMIT to override."
  exit 0
elif [ "$PREVIOUS" = "$CURRENT" ]; then
  echo "Fingerprint unchanged for $FP_PLATFORM — installed Dev Tool $TARGET client still current, skipping build."
  exit 0
else
  echo "Fingerprint changed for $FP_PLATFORM — building a new Dev Tool $TARGET client."
fi

if [ "$TARGET" = "ios" ]; then
  eas build --platform ios --profile devtool --auto-submit --non-interactive
elif [ "$TARGET" = "ios-sim" ]; then
  # iOS Simulator builds have no TestFlight/submit path, so we host the .app
  # tarball ourselves like the Android APK. Devs download, untar, and install on
  # a booted simulator with `xcrun simctl install booted <Couchers Dev Tool.app>`.
  BUILD_JSON="$(eas build --platform ios --profile devtool-simulator --non-interactive --json)"
  APP_URL="$(printf '%s' "$BUILD_JSON" | json_field '[0].artifacts.applicationArchiveUrl')"
  [ -n "$APP_URL" ] || {
    echo "could not find the simulator app artifact URL in the eas build output" >&2
    exit 1
  }
  echo "simulator app artifact: $APP_URL"
  curl -fSL "$APP_URL" -o couchers-devtool-sim.tar.gz

  SUBPATH="ios-simulator"
  PREFIX="devtool-builds/${CI_COMMIT_REF_SLUG}/${SUBPATH}"
  APP_NAME="couchers-devtool-${CI_COMMIT_SHORT_SHA}.tar.gz"
  aws s3 cp couchers-devtool-sim.tar.gz "s3://${AWS_PREVIEW_BUCKET}/${PREFIX}/${APP_NAME}" \
    --content-type application/gzip

  cat > index.html <<HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Couchers Dev Tool — iOS Simulator</title>
</head>
<body style="font-family: sans-serif; max-width: 32rem; margin: 3rem auto; padding: 0 1rem">
<h1>Couchers Dev Tool (iOS Simulator)</h1>
<p><a href="./${APP_NAME}" style="font-size: 1.25rem">Download the latest simulator build</a></p>
<p>Built from commit <code>${CI_COMMIT_SHORT_SHA}</code>. macOS only. To install:</p>
<pre>tar xf ${APP_NAME}
xcrun simctl boot "iPhone 16" 2&gt;/dev/null || true
open -a Simulator
xcrun simctl install booted "Couchers Dev Tool.app"</pre>
<p>Then run <code>npx expo start</code> and open the app. Re-open this page to grab newer builds.</p>
<p>For a physical iPhone, install the Dev Tool from TestFlight instead.</p>
</body>
</html>
HTML
  # Stable pointer — overwritten each build, so revalidate rather than cache.
  aws s3 cp index.html "s3://${AWS_PREVIEW_BUCKET}/${PREFIX}/index.html" \
    --content-type "text/html; charset=utf-8" --cache-control "no-cache"
  echo "Simulator build published: https://${BUILDS_HOST}/${SUBPATH}/${APP_NAME}"
  echo "Stable page:               https://${BUILDS_HOST}/${SUBPATH}/"
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

  SUBPATH="android"
  PREFIX="devtool-builds/${CI_COMMIT_REF_SLUG}/${SUBPATH}"
  APK_NAME="couchers-devtool-${CI_COMMIT_SHORT_SHA}.apk"
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
  echo "APK published: https://${BUILDS_HOST}/${SUBPATH}/${APK_NAME}"
  echo "Stable page:   https://${BUILDS_HOST}/${SUBPATH}/"
fi

echo "Built Dev Tool $TARGET client at fingerprint $CURRENT."
