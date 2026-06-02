#!/usr/bin/env bash
# Check the working-tree Expo fingerprint matches .fingerprint-baseline-<platform>.
# Usage: check-fingerprint-baseline.sh <ios|android>
# Env:   ALLOW_FINGERPRINT_BASELINE_MISMATCH=true  bypass (emergency only)
# Run from app/mobile (node_modules must be present).
set -euo pipefail

PLATFORM="${1:?usage: check-fingerprint-baseline.sh <ios|android>}"
case "$PLATFORM" in
  ios | android) ;;
  *)
    echo "platform must be ios or android (got $PLATFORM)" >&2
    exit 1
    ;;
esac

BASELINE_FILE=".fingerprint-baseline-${PLATFORM}"
if [ ! -f "$BASELINE_FILE" ]; then
  echo "missing $BASELINE_FILE" >&2
  exit 1
fi

json_field() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(String(eval("j"+process.argv[1])??""))})' "$1"; }

CURRENT="$(npx expo-updates fingerprint:generate --platform "$PLATFORM" 2>/dev/null | json_field '.hash')"
BASELINE="$(tr -d '[:space:]' < "$BASELINE_FILE")"

echo "$PLATFORM fingerprint:"
echo "  baseline (committed): $BASELINE"
echo "  current  (worktree):  $CURRENT"

if [ "$CURRENT" = "$BASELINE" ]; then
  exit 0
fi

if [ "${ALLOW_FINGERPRINT_BASELINE_MISMATCH:-}" = "true" ]; then
  echo "WARNING: bypassing baseline mismatch (ALLOW_FINGERPRINT_BASELINE_MISMATCH=true)." >&2
  exit 0
fi

cat >&2 <<EOF

Fingerprint for $PLATFORM differs from the committed baseline — native binary
changed and can't ship via OTA. To bless it in this same PR:

  - Replace $BASELINE_FILE with: $CURRENT
  - If the change exposes new native code to JS, bump
    CAPABILITY_PLATFORM_VERSION and/or add a capability name in
    modules/platform-capabilities/{ios,android}/...

Emergency override: ALLOW_FINGERPRINT_BASELINE_MISMATCH=true on the pipeline.
EOF
exit 1
