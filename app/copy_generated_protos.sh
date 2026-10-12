#!/bin/sh
# Copies protos generated under proto/gen to source trees needing them.
set -e

# Switch to script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
cd "$SCRIPT_DIR" || exit 1

# backend
mkdir -p backend/src/couchers/proto
cp -a proto/gen/python/descriptors.pb backend/src/couchers/proto/descriptors.pb
cp -a proto/gen/python/api/. backend/src/couchers/proto/
cp -a proto/gen/python/backend/. backend/src/couchers/proto/

# client
mkdir -p client/src/couchers/proto/google/api
touch client/src/couchers/proto/__init__.py
touch client/src/couchers/proto/google/__init__.py
touch client/src/couchers/proto/google/api/__init__.py
cp -a proto/gen/python/api/. client/src/couchers/proto/

# media
mkdir -p media/src/media/proto/
cp -a proto/gen/python/api/. media/src/media/proto/

# proxy
cp -a proto/gen/python/descriptors.pb proxy/descriptors.pb

# web
mkdir -p web/proto/
cp -a proto/gen/ts/api/. web/proto/

# mobile
mkdir -p mobile/proto/
cp -a proto/gen/ts/api/. mobile/proto/
