#!/bin/sh
# Vercel build command (see vercel.json): installs the protoc dependencies needed
# to generate the TypeScript protobuf bindings, then builds the Next.js app.
set -e

cd "$(dirname "$0")"

# Use the Vercel environment config
cp .env.vercel env
rm .env.*
mv env .env.local

# Download protoc dependencies
DEPS_DIR=/tmp/deps
mkdir -p "$DEPS_DIR"
(
  cd "$DEPS_DIR"

  curl -sSL https://github.com/protocolbuffers/protobuf/releases/download/v27.0/protoc-27.0-linux-x86_64.zip -o protoc.zip
  unzip -qq -o protoc.zip

  curl -sSL https://github.com/grpc/grpc-web/releases/download/1.5.0/protoc-gen-grpc-web-1.5.0-linux-x86_64 -o protoc-gen-grpc-web
  chmod +x protoc-gen-grpc-web

  curl -sSL https://github.com/protocolbuffers/protobuf-javascript/releases/download/v3.21.2/protobuf-javascript-3.21.2-linux-x86_64.zip -o protobuf-javascript.zip
  unzip -qq -o protobuf-javascript.zip
)
export PATH="$DEPS_DIR:$DEPS_DIR/bin:$PATH"
export PROTOC_INCLUDE="$DEPS_DIR/include"

if ! command -v rsync >/dev/null 2>&1; then
  dnf install -y rsync
fi

make protos
npx next build
