#!/bin/sh
set -e

# create the directories if they don't exist
rm -rf proto/gen
mkdir -p proto/gen/python/proto
mkdir -p proto/gen/ts/proto
mkdir -p backend/src/proto/
mkdir -p media/src/proto/
mkdir -p web/proto/
mkdir -p native/proto/
mkdir -p client/src/couchers/proto/google/api
touch client/src/couchers/proto/__init__.py
touch client/src/couchers/proto/google/__init__.py
touch client/src/couchers/proto/google/api/__init__.py

# generate API protos and grpc stuff
find proto -name '*.proto' | protoc -I proto \
  --plugin=protoc-gen-grpc_python=$(which grpc_python_plugin) \
  --include_imports --include_source_info \
  \
  --descriptor_set_out proto/gen/descriptors.pb \
  \
  --python_out=proto/gen/python/proto \
  --grpc_python_out=proto/gen/python/proto \
  \
  --python_out=backend/src/proto \
  --grpc_python_out=backend/src/proto \
  \
  --python_out=client/src/couchers/proto \
  --grpc_python_out=client/src/couchers/proto \
  \
  --python_out=media/src/proto \
  --grpc_python_out=media/src/proto \
  \
  --js_out="import_style=commonjs,binary:proto/gen/ts/proto" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:proto/gen/ts/proto" \
  \
  --js_out="import_style=commonjs,binary:web/proto" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:web/proto" \
  \
  --js_out="import_style=commonjs,binary:native/proto" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:native/proto" \
  \
  $(xargs)

# protoc only allows passing --descriptor_set_out once...
cp proto/gen/descriptors.pb proxy/descriptors.pb
cp proto/gen/descriptors.pb backend/src/proto/descriptors.pb

# create internal backend protos
(cd backend && find proto -name '*.proto' | protoc -I proto \
  --python_out=src/proto \
  $(xargs))

# fixup python3 relative imports with oneliner from
# https://github.com/protocolbuffers/protobuf/issues/1491#issuecomment-690618628
sed -i -E 's/^import.*_pb2/from . &/' proto/gen/python/proto/*.py backend/src/proto/*.py client/src/couchers/proto/*.py media/src/proto/*.py
sed -i -E 's/^from google.api/from .google.api/' proto/gen/python/proto/*.py backend/src/proto/*.py client/src/couchers/proto/*.py media/src/proto/*.py
sed -i -E 's/^from google.api/from ./' proto/gen/python/proto/google/api/*.py backend/src/proto/google/api/*.py client/src/couchers/proto/google/api/*.py media/src/proto/google/api/*.py

(cd proto/gen/python && tar czf ../python.tar.gz proto)
(cd proto/gen/ts && tar czf ../ts.tar.gz proto)

echo "OK"
