#!/bin/sh
set -e

# create the directories if they don't exist
rm -rf gen/

# relax_strict_optional_primitives allows passing None to Message.__init__
MYPY_OUT_OPTS="quiet,relax_strict_optional_primitives"
MYPY_GRPC_OUT_OPTS="quiet,only_sync"

# # create internal backend protos
find -name '*.proto' | protoc \
  --python_out=gen \
  --mypy_out=${MYPY_OUT_OPTS}:gen \
  --mypy_grpc_out=${MYPY_GRPC_OUT_OPTS}:gen \
  $(xargs))

# fixup python3 relative imports with oneliner from
# https://github.com/protocolbuffers/protobuf/issues/1491#issuecomment-690618628
sed -i -E 's/^import.*_pb2/from . &/' gen/*.py

# delete TypeVar definitions and Stub classes from _grpc.pyi files
# these are not used, and cause huge memory consumption when type-checking.
# Also patches method parameters to accept CouchersContext and sqlalchemy Session.
for f in $(find gen/python -name '*_grpc.pyi' -type f); do
  python3 ../../proto/postprocess_grpc_stubs.py "$f"
done
