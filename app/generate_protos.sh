#!/bin/sh
set -e

# generate API protos and grpc stuff
find proto -name '*.proto' | protoc -I. \
  --plugin=protoc-gen-grpc_python=$(which grpc_python_plugin) \
  --include_imports --include_source_info \
  \
  --descriptor_set_out proxy/protos.pb \
  \
  --python_out=backend/src \
  --grpc_python_out=backend/src \
  \
  --python_out=media/src \
  --grpc_python_out=media/src \
  \
  --js_out="import_style=commonjs,binary:frontend/src" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:frontend/src" \
  \
  $(xargs)

# create internal backend protos
cd backend && find proto -name '*.proto' | protoc \
  --python_out=src \
  $(xargs)

echo "OK"
