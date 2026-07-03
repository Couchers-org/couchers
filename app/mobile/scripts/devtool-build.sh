#!/usr/bin/env bash
# Rebuild the Dev Tool native client on EAS when its fingerprint changes.
# Usage: devtool-build.sh <ios|android|ios-sim|index>  (run from app/mobile)
#   ios      → device build, auto-submitted to TestFlight
#   android  → APK, self-hosted on the dev-assets bucket
#   ios-sim  → iOS Simulator build, self-hosted on the dev-assets bucket
#   index    → (re)write the single Dev Tool landing page; no build, no gating
# Env:   EXPO_TOKEN             EAS auth (build + submit scope)
#        AWS_PREVIEW_BUCKET     the couchers-dev-assets bucket (hosts the APK/sim build)
#        PREVIEW_DOMAIN         the dev-assets CDN domain (preview.couchershq.org)
#        CI_COMMIT_REF_SLUG     the branch slug (develop); the preview-subdomain ref
#        CI_COMMIT_BEFORE_SHA   GitLab-provided previous HEAD; reads prior file
#        plus the AWS creds the aws CLI reads from the environment
set -euo pipefail

TARGET="${1:?usage: devtool-build.sh <ios|android|ios-sim|index>}"
case "$TARGET" in
  ios | android | ios-sim | index) ;;
  *)
    echo "target must be ios, android, ios-sim, or index (got $TARGET)" >&2
    exit 1
    ;;
esac

VARIANT=devtool

# The self-hosted client downloads all live under one Dev Tool page, following the
# preview-subdomain rewriter's {ref}--{artifact-type} convention: {ref}--devtool-builds
# maps to the bucket prefix devtool-builds/{ref}/, with the landing page at the root
# and each platform's artifact in a sub-path (mirrors the {sha}--ota/{platform} OTA
# layout). The ref is the branch slug (develop), so the URL is stable and bookmarkable.
BUILDS_HOST="${CI_COMMIT_REF_SLUG}--devtool-builds.${PREVIEW_DOMAIN}"
BUILDS_PREFIX="devtool-builds/${CI_COMMIT_REF_SLUG}"
# Filenames are stable (no commit sha) and overwritten in place each build, so the
# one landing page can link to them regardless of which platform rebuilt this run.
APK_NAME="couchers-devtool.apk"
SIM_NAME="couchers-devtool-simulator.tar.gz"

# Uploads a body to the bucket. The page and the binaries are overwritten in place,
# so they must revalidate rather than serve a stale cached copy.
publish() { # <local-file> <key-suffix> <content-type>
  aws s3 cp "$1" "s3://${AWS_PREVIEW_BUCKET}/${BUILDS_PREFIX}/$2" \
    --content-type "$3" --cache-control "no-cache"
}

# The single Dev Tool landing page. Static (links to the stable filenames), so it's
# correct even when only some platforms rebuilt this run.
write_index() {
  cat > index.html <<HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Couchers Dev Tool</title>
</head>
<body style="font-family: sans-serif; max-width: 36rem; margin: 3rem auto; padding: 0 1rem; line-height: 1.5">
<h1>Couchers Dev Tool</h1>
<p>A development build of the Couchers app. Install it once, then load any branch over
the air with <code>npx expo start</code> or a pull request's QR code — pure JS/TS changes
never need a fresh install.</p>

<h2>iPhone / iPad</h2>
<p>Install from <strong>TestFlight</strong> — ask a maintainer for an invite. A signed
device build can't be sideloaded outside TestFlight.</p>

<h2>iOS Simulator (macOS)</h2>
<p><a href="./ios-simulator/${SIM_NAME}">Download the latest simulator build</a>, then:</p>
<pre>tar xf ${SIM_NAME}
open -a Simulator
xcrun simctl install booted "Couchers Dev Tool.app"</pre>

<h2>Android</h2>
<p><a href="./android/${APK_NAME}">Download the latest APK</a>. Enable "install from
unknown sources" to sideload.</p>

<p style="color: #666; margin-top: 2rem">Re-download to grab newer builds.</p>
</body>
</html>
HTML
  publish index.html "index.html" "text/html; charset=utf-8"
  echo "Dev Tool page published: https://${BUILDS_HOST}/"
}

if [ "$TARGET" = "index" ]; then
  write_index
  exit 0
fi

# node, not jq — the node:22 image has no jq.
json_field() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(String(eval("j"+process.argv[1])??""))})' "$1"; }

# The iOS Simulator build shares the device build's native fingerprint — the
# `simulator` flag lives in eas.json, which is excluded from the runtime
# fingerprint — so gate ios-sim on the same `devtool/ios` entry.
case "$TARGET" in
  ios-sim) FP_PLATFORM=ios ;;
  *) FP_PLATFORM="$TARGET" ;;
esac

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
  curl -fSL "$APP_URL" -o "$SIM_NAME"
  publish "$SIM_NAME" "ios-simulator/${SIM_NAME}" "application/gzip"
  echo "Simulator build published: https://${BUILDS_HOST}/ios-simulator/${SIM_NAME}"
else
  # No Play TestFlight-equivalent for a dev-client APK, so we host it ourselves.
  BUILD_JSON="$(eas build --platform android --profile devtool-apk --non-interactive --json)"
  APK_URL="$(printf '%s' "$BUILD_JSON" | json_field '[0].artifacts.applicationArchiveUrl')"
  [ -n "$APK_URL" ] || {
    echo "could not find the APK artifact URL in the eas build output" >&2
    exit 1
  }
  echo "APK artifact: $APK_URL"
  curl -fSL "$APK_URL" -o "$APK_NAME"
  publish "$APK_NAME" "android/${APK_NAME}" "application/vnd.android.package-archive"
  echo "APK published: https://${BUILDS_HOST}/android/${APK_NAME}"
fi

echo "Built Dev Tool $TARGET client at fingerprint $CURRENT."
