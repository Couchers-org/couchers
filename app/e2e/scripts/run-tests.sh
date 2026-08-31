#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source ~/.nvm/nvm.sh && nvm use
npx playwright test "$@" 2>&1
