#!/bin/sh
PROTOC=${PROTOC:-protoc}
DONT_GENERATE_PY=${DONT_GENERATE_PY:-}
DONT_GENERATE_JS=${DONT_GENERATE_JS:-}

if [[ -z "${DONT_GENERATE_PY}" ]]; then
  echo "Genearting python protos..."
  find pb -name '*.proto' | $PROTOC -I. \
    --python_out=backend/src \
    --grpc_python_out=backend/src \
    --python_out=media/src \
    --grpc_python_out=media/src \
    --plugin=protoc-gen-grpc_python=$(which grpc_python_plugin) \
    \
    $(xargs)
fi

if [[ -z "${DONT_GENERATE_JS}" ]]; then
  echo "Genearting javascript protos..."
  find pb -name '*.proto' | $PROTOC -I. \
    --js_out="import_style=commonjs,binary:frontend/src" \
    --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:frontend/src" \
    \
    $(xargs)
fi
