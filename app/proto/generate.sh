#!/bin/sh
# Builds the API and backend protobuf definitions to generate bindings under:
#   ${GEN_DIR}/api/python
#   ${GEN_DIR}/api/ts
#   ${GEN_DIR}/api/descriptors.pb
#   ${GEN_DIR}/backend
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
GEN_DIR="$(realpath -m "${1:-$SCRIPT_DIR/gen}")"

# Switch to script directory
cd "$SCRIPT_DIR" || exit 1

# create the directories if they don't exist
rm -rf "$GEN_DIR"
mkdir -p "$GEN_DIR/api/python"
mkdir -p "$GEN_DIR/api/ts"
mkdir -p "$GEN_DIR/backend"

# relax_strict_optional_primitives allows passing None to Message.__init__
MYPY_OUT_OPTS="quiet,relax_strict_optional_primitives"
MYPY_GRPC_OUT_OPTS="quiet,only_sync"

# generate API protos and grpc stuff
find api -name '*.proto' | protoc -I api \
  --plugin=protoc-gen-grpc_python=$(which grpc_python_plugin) \
  --include_imports --include_source_info \
  \
  --descriptor_set_out "$GEN_DIR/api/descriptors.pb" \
  \
  --python_out="$GEN_DIR/api/python" \
  --grpc_python_out="$GEN_DIR/api/python" \
  --mypy_out="${MYPY_OUT_OPTS}:$GEN_DIR/api/python" \
  --mypy_grpc_out="${MYPY_GRPC_OUT_OPTS}:$GEN_DIR/api/python" \
  \
  --js_out="import_style=commonjs,binary:$GEN_DIR/api/ts" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:$GEN_DIR/api/ts" \
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
sed -i -E 's/^import.*_pb2/from . &/' "$GEN_DIR/api/python"/*.py
sed -i -E 's/^from google.api/from .google.api/' "$GEN_DIR/api/python"/*.py
sed -i -E 's/^from google.api/from ./' "$GEN_DIR/api/python/google/api"/*.py

# delete TypeVar definitions and Stub classes from _grpc.pyi files
# these are not used, and cause huge memory consumption when type-checking.
# Also patches method parameters to accept CouchersContext and sqlalchemy Session.
find "$GEN_DIR/api/python" -name '*_grpc.pyi' -type f -exec python3 postprocess_grpc_stubs.py {} \;

(cd "$GEN_DIR/api" && tar czf python.tar.gz --transform 's,^python/,proto/,' python)
(cd "$GEN_DIR/api" && tar czf ts.tar.gz --transform 's,^ts/,proto/,' ts)
