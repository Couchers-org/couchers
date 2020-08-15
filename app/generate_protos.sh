#!/bin/sh
PROTOC=${PROTOC:-protoc}
find pb -name '*.proto' | $PROTOC -I. \
  --python_out=backend/src \
  --grpc_python_out=backend/src \
  --python_out=media/src \
  --grpc_python_out=media/src \
  --plugin=protoc-gen-grpc_python=$(which grpc_python_plugin) \
  $(xargs)
  # \
  # --js_out="import_style=commonjs,binary:frontend/src" \
  # --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:frontend/src" \
  # \
