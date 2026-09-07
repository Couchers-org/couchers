#!/bin/sh
# Generates public protos under ./gen/python and ./gen/ts
set -e

SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
SRC_DIR=${1:-.}
GEN_DIR=${2:-${SRC_DIR}/gen}

# create the directories if they don't exist
rm -rf "${GEN_DIR}/"
mkdir -p "${GEN_DIR}/python"
mkdir -p "${GEN_DIR}/ts"

# relax_strict_optional_primitives allows passing None to Message.__init__
MYPY_OUT_OPTS="quiet,relax_strict_optional_primitives"
MYPY_GRPC_OUT_OPTS="quiet,only_sync"

# generate API protos and grpc stuff
find "${SRC_DIR}" -name '*.proto' | protoc -I "${SRC_DIR}" \
  --plugin=protoc-gen-grpc_python=$(which grpc_python_plugin) \
  --include_imports --include_source_info \
  \
  --descriptor_set_out ${GEN_DIR}/descriptors.pb \
  \
  --python_out=${GEN_DIR}/python \
  --grpc_python_out=${GEN_DIR}/python \
  --mypy_out=${MYPY_OUT_OPTS}:${GEN_DIR}/python \
  --mypy_grpc_out=${MYPY_GRPC_OUT_OPTS}:${GEN_DIR}/python \
  \
  --js_out="import_style=commonjs,binary:${GEN_DIR}/ts" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:${GEN_DIR}/ts" \
  \
  $(xargs)

# fixup python3 relative imports with oneliner from
# https://github.com/protocolbuffers/protobuf/issues/1491#issuecomment-690618628
sed -i -E 's/^import.*_pb2/from . &/' ${GEN_DIR}/python/*.py
sed -i -E 's/^from google.api/from .google.api/' ${GEN_DIR}/python/*.py
sed -i -E 's/^from google.api/from ./' ${GEN_DIR}/python/google/api/*.py

"${SCRIPT_DIR}/fixup_python.sh" "${GEN_DIR}/python"

(cd "${GEN_DIR}" && tar czf python.tar.gz python)
(cd "${GEN_DIR}" && tar czf ts.tar.gz ts)
