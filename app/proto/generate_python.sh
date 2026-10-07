#!/bin/sh
# Builds the API and backend protobuf definitions to generate Python bindings under:
#   gen/python/api
#   gen/python/backend
#   gen/python/descriptors.pb
#   gen/python/python.tar.gz
#
# Usage: generate_python.sh [--auto-container]
#   --auto-container: run in the GRPC container if dependencies are not installed locally.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
GEN_DIR="$SCRIPT_DIR/gen/python"
PROTO_IMAGE=registry.gitlab.com/couchers/grpc

if [ "$1" = "--auto-container" ]; then
  shift
  # Keep running locally if all dependencies are installed, otherwise rerun in the container.
  if ! { command -v protoc \
    && command -v grpc_python_plugin \
    && command -v protoc-gen-mypy \
    && command -v protoc-gen-mypy_grpc \
    && command -v python3; } >/dev/null 2>&1; then
    if ! command -v docker >/dev/null 2>&1; then
      echo "error: neither the python protoc dependencies nor docker are installed" >&2
      exit 1
    fi
    docker pull -q "$PROTO_IMAGE" >/dev/null
    # The container runs as root, so pass the host user to chown the generated files back.
    exec docker run --rm -e HOST_UID="$(id -u)" -e HOST_GID="$(id -g)" \
      -v "$SCRIPT_DIR:/app" -w /app "$PROTO_IMAGE" ./generate_python.sh
  fi
fi

# Switch to script directory
cd "$SCRIPT_DIR" || exit 1

# create the directories if they don't exist
rm -rf "$GEN_DIR"
mkdir -p "$GEN_DIR/api"
mkdir -p "$GEN_DIR/backend"

# relax_strict_optional_primitives allows passing None to Message.__init__
MYPY_OUT_OPTS="quiet,relax_strict_optional_primitives"
MYPY_GRPC_OUT_OPTS="quiet,only_sync"

# generate API protos and grpc stuff
find api -name '*.proto' | protoc -I api \
  --plugin=protoc-gen-grpc_python=$(which grpc_python_plugin) \
  --include_imports --include_source_info \
  \
  --descriptor_set_out "$GEN_DIR/descriptors.pb" \
  \
  --python_out="$GEN_DIR/api" \
  --grpc_python_out="$GEN_DIR/api" \
  --mypy_out="${MYPY_OUT_OPTS}:$GEN_DIR/api" \
  --mypy_grpc_out="${MYPY_GRPC_OUT_OPTS}:$GEN_DIR/api" \
  \
  $(xargs)

# create internal backend protos
(find backend -name '*.proto' | protoc -I backend \
  --python_out="$GEN_DIR/backend" \
  --mypy_out="${MYPY_OUT_OPTS}:$GEN_DIR/backend" \
  --mypy_grpc_out="${MYPY_GRPC_OUT_OPTS}:$GEN_DIR/backend" \
  $(xargs))

# fixup python3 relative imports with oneliner from
# https://github.com/protocolbuffers/protobuf/issues/1491#issuecomment-690618628
sed -i -E 's/^import.*_pb2/from . &/' "$GEN_DIR/api"/*.py
sed -i -E 's/^from google.api/from .google.api/' "$GEN_DIR/api"/*.py
sed -i -E 's/^from google.api/from ./' "$GEN_DIR/api/google/api"/*.py

# delete TypeVar definitions and Stub classes from _grpc.pyi files
# these are not used, and cause huge memory consumption when type-checking.
# Also patches method parameters to accept CouchersContext and sqlalchemy Session.
find "$GEN_DIR/api" -name '*_grpc.pyi' -type f -exec python3 postprocess_grpc_stubs.py {} \;

(cd "$GEN_DIR" && tar czf python.tar.gz --transform 's,^api,proto,' api)

if [ -n "$HOST_UID" ]; then
  chown "$HOST_UID:$HOST_GID" "$SCRIPT_DIR/gen"
  chown -R "$HOST_UID:$HOST_GID" "$GEN_DIR"
fi
