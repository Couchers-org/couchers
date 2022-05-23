#!/bin/sh
set -e

mkdir -p proto

# generate API protos and grpc stuff
find proto_src -name '*.proto' | protoc -I proto_src \
  --plugin=protoc-gen-grpc_python=$(which grpc_python_plugin) \
  --include_imports --include_source_info \
  \
  --js_out="import_style=commonjs,binary:proto" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:proto" \
  \
  $(xargs)

echo "OK"
