#!/bin/sh
find pb -name '*.proto' | protoc -I. \
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
  --js_out="import_style=commonjs,binary:vue/src" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:vue/src" \
  \
  $(xargs)
