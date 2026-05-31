#!/bin/sh
set -e

# create the directories if they don't exist
rm -rf proto/gen
mkdir -p proto/gen/python/proto
mkdir -p proto/gen/ts/proto
mkdir -p backend/src/couchers/proto/
mkdir -p media/src/media/proto/
mkdir -p web/proto/
mkdir -p mobile/proto/
mkdir -p client/src/couchers/proto/google/api
touch client/src/couchers/proto/__init__.py
touch client/src/couchers/proto/google/__init__.py
touch client/src/couchers/proto/google/api/__init__.py

# relax_strict_optional_primitives allows passing None to Message.__init__
MYPY_OUT_OPTS="quiet,relax_strict_optional_primitives"
MYPY_GRPC_OUT_OPTS="quiet,only_sync"

# generate API protos and grpc stuff
find proto -name '*.proto' | protoc -I proto \
  --plugin=protoc-gen-grpc_python=$(which grpc_python_plugin) \
  --include_imports --include_source_info \
  \
  --descriptor_set_out proto/gen/descriptors.pb \
  \
  --python_out=proto/gen/python/proto \
  --grpc_python_out=proto/gen/python/proto \
  --mypy_out=${MYPY_OUT_OPTS}:proto/gen/python/proto \
  --mypy_grpc_out=${MYPY_GRPC_OUT_OPTS}:proto/gen/python/proto \
  \
  --python_out=backend/src/couchers/proto \
  --grpc_python_out=backend/src/couchers/proto \
  --mypy_out=${MYPY_OUT_OPTS}:backend/src/couchers/proto \
  --mypy_grpc_out=${MYPY_GRPC_OUT_OPTS}:backend/src/couchers/proto \
  \
  --python_out=client/src/couchers/proto \
  --grpc_python_out=client/src/couchers/proto \
  --mypy_out=${MYPY_OUT_OPTS}:client/src/couchers/proto \
  --mypy_grpc_out=${MYPY_GRPC_OUT_OPTS}:client/src/couchers/proto \
  \
  --python_out=media/src/media/proto \
  --grpc_python_out=media/src/media/proto \
  --mypy_out=${MYPY_OUT_OPTS}:media/src/media/proto \
  --mypy_grpc_out=${MYPY_GRPC_OUT_OPTS}:media/src/media/proto \
  \
  --js_out="import_style=commonjs,binary:proto/gen/ts/proto" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:proto/gen/ts/proto" \
  \
  --js_out="import_style=commonjs,binary:web/proto" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:web/proto" \
  \
  --js_out="import_style=commonjs,binary:mobile/proto" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:mobile/proto" \
  \
  $(xargs)

# protoc only allows passing --descriptor_set_out once...
cp proto/gen/descriptors.pb proxy/descriptors.pb
cp proto/gen/descriptors.pb backend/src/couchers/proto/descriptors.pb

# create internal backend protos
(cd backend && find proto -name '*.proto' | protoc -I proto \
  --python_out=src/couchers/proto \
  --mypy_out=${MYPY_OUT_OPTS}:src/couchers/proto \
  --mypy_grpc_out=${MYPY_GRPC_OUT_OPTS}:src/couchers/proto \
  $(xargs))

# fixup python3 relative imports with oneliner from
# https://github.com/protocolbuffers/protobuf/issues/1491#issuecomment-690618628
sed -i -E 's/^import.*_pb2/from . &/' proto/gen/python/proto/*.py backend/src/couchers/proto/*.py client/src/couchers/proto/*.py media/src/media/proto/*.py
sed -i -E 's/^from google.api/from .google.api/' proto/gen/python/proto/*.py backend/src/couchers/proto/*.py client/src/couchers/proto/*.py media/src/media/proto/*.py
sed -i -E 's/^from google.api/from ./' proto/gen/python/proto/google/api/*.py backend/src/couchers/proto/google/api/*.py client/src/couchers/proto/google/api/*.py media/src/media/proto/google/api/*.py

# delete TypeVar definitions and Stub classes from _grpc.pyi files
# these are not used, and cause huge memory consumption when type-checking.
# Also patches method parameters to accept CouchersContext and sqlalchemy Session.
find proto/gen/python/proto -name '*_grpc.pyi' -type f -exec python3 postprocess_grpc_stubs.py {} \;
find backend/src/couchers/proto -name '*_grpc.pyi' -type f -exec python3 postprocess_grpc_stubs.py {} \;
find client/src/couchers/proto -name '*_grpc.pyi' -type f -exec python3 postprocess_grpc_stubs.py {} \;
find media/src/media/proto -name '*_grpc.pyi' -type f -exec python3 postprocess_grpc_stubs.py {} \;

(cd proto/gen/python && tar czf ../python.tar.gz proto)
(cd proto/gen/ts && tar czf ../ts.tar.gz proto)

echo "OK"
