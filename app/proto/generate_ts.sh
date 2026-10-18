#!/bin/sh
# Builds the API protobuf definitions to generate TypeScript (grpc-web) bindings under:
#   gen/ts/api
#   gen/ts/ts.tar.gz
#
# Usage: generate_ts.sh [--auto-container]
#   --auto-container: run in the GRPC container if dependencies are not installed locally.
#
# Set PROTOC_INCLUDE to add an include path for the well-known google/protobuf types
# if they are not installed alongside protoc.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
GEN_DIR="$SCRIPT_DIR/gen/ts"
PROTO_IMAGE=registry.gitlab.com/couchers/grpc

if [ "$1" = "--auto-container" ]; then
  shift
  # Keep running locally if all dependencies are installed, otherwise rerun in the container.
  if ! { command -v protoc \
    && command -v protoc-gen-js \
    && command -v protoc-gen-grpc-web; } >/dev/null 2>&1; then
    if ! command -v docker >/dev/null 2>&1; then
      echo "error: neither the typescript protoc dependencies nor docker are installed" >&2
      exit 1
    fi
    docker pull -q "$PROTO_IMAGE" >/dev/null
    # The container runs as root, so pass the host user to chown the generated files back.
    exec docker run --rm -e HOST_UID="$(id -u)" -e HOST_GID="$(id -g)" \
      -v "$SCRIPT_DIR:/app" -w /app "$PROTO_IMAGE" ./generate_ts.sh
  fi
fi

# Switch to script directory
cd "$SCRIPT_DIR" || exit 1

# create the directories if they don't exist
rm -rf "$GEN_DIR"
mkdir -p "$GEN_DIR/api"

# generate API protos and grpc-web stuff
find api -name '*.proto' | protoc -I api ${PROTOC_INCLUDE:+-I "$PROTOC_INCLUDE"} \
  --js_out="import_style=commonjs,binary:$GEN_DIR/api" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:$GEN_DIR/api" \
  \
  $(xargs)

(cd "$GEN_DIR" && tar czf ts.tar.gz --transform 's,^api,proto,' api)

if [ -n "$HOST_UID" ]; then
  chown "$HOST_UID:$HOST_GID" "$SCRIPT_DIR/gen"
  chown -R "$HOST_UID:$HOST_GID" "$GEN_DIR"
fi
