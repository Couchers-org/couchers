#!/usr/bin/env bash
# Check that the working-tree Expo fingerprint matches the committed baseline.
#
# WHY: a fingerprint change means the native binary changed (new Expo plugin,
# new native module, SDK bump, app.config edit that affects the resolved native
# config). When the OTA runtimeVersion is pinned (or even just to keep human
# review on store-binary churn), every native change should be an intentional,
# reviewed event — not something that sneaks in via a transitive dependency.
#
# The baseline file is the blessed fingerprint, committed at the same time as
# the native change that produced it. The PR that bumps the baseline IS the
# manual override; reviewers see the bump in the diff and can ask "did you also
# update the platform-capabilities registry?".
#
# Usage: check-fingerprint-baseline.sh <ios|android>
# Env:   ALLOW_FINGERPRINT_BASELINE_MISMATCH=true  emergency-only escape hatch
#                                                  (no PR review)
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
  echo "missing $BASELINE_FILE — expected the blessed fingerprint to be committed here" >&2
  exit 1
fi

# Read a single JSON field from stdin with node (no jq in the node:22 image).
json_field() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(String(eval("j"+process.argv[1])??""))})' "$1"; }

CURRENT="$(npx expo-updates fingerprint:generate --platform "$PLATFORM" 2>/dev/null | json_field '.hash')"
BASELINE="$(tr -d '[:space:]' < "$BASELINE_FILE")"

echo "$PLATFORM fingerprint:"
echo "  baseline (committed): $BASELINE"
echo "  current  (worktree):  $CURRENT"

if [ "$CURRENT" = "$BASELINE" ]; then
  echo "Fingerprint matches the committed baseline."
  exit 0
fi

if [ "${ALLOW_FINGERPRINT_BASELINE_MISMATCH:-}" = "true" ]; then
  echo "WARNING: fingerprint differs from baseline, but ALLOW_FINGERPRINT_BASELINE_MISMATCH=true — proceeding." >&2
  exit 0
fi

cat >&2 <<EOF

Fingerprint for $PLATFORM has changed since the last blessed native build.

This means something in this branch alters the native binary (a new Expo
plugin or native module, an SDK bump, an app.config change that flows into
the prebuild output, a new file picked up by autolinking, etc.). The OTA
channel CANNOT deliver this change — only a fresh store binary can.

To proceed, in this same PR:

  1. Decide whether the native change is intentional. If not, revert it.
  2. Update modules/platform-capabilities/ios/PlatformCapabilitiesModule.swift
     and android/.../PlatformCapabilitiesModule.kt — bump
     CAPABILITY_PLATFORM_VERSION and (if the change exposes a new feature to
     JS) add a capability name on both platforms.
  3. Replace the contents of $BASELINE_FILE with: $CURRENT
  4. Commit. Mention the underlying native change in the PR description so
     reviewers know what they're blessing.

Emergency-only: set ALLOW_FINGERPRINT_BASELINE_MISMATCH=true on the pipeline.
EOF
exit 1
