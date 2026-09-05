#!/bin/sh
# Generates internal protos under ./gen
set -e

SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
SRC_DIR=${1:-.}
GEN_DIR=${2:-${SRC_DIR}/gen}

# create the directories if they don't exist
rm -rf "${GEN_DIR}/"
mkdir -p "${GEN_DIR}/"

# relax_strict_optional_primitives allows passing None to Message.__init__
MYPY_OUT_OPTS="quiet,relax_strict_optional_primitives"
MYPY_GRPC_OUT_OPTS="quiet,only_sync"

(find "${SRC_DIR}" -name '*.proto' | protoc -I "${SRC_DIR}" \
  --python_out=${GEN_DIR} \
  --mypy_out=${MYPY_OUT_OPTS}:${GEN_DIR} \
  --mypy_grpc_out=${MYPY_GRPC_OUT_OPTS}:${GEN_DIR} \
  $(xargs))

"${SCRIPT_DIR}/fixup_python.sh" "${GEN_DIR}"
