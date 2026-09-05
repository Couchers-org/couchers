SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
GEN_DIR="$1"

# delete TypeVar definitions and Stub classes from _grpc.pyi files
# these are not used, and cause huge memory consumption when type-checking.
# Also patches method parameters to accept CouchersContext and sqlalchemy Session.
for f in $(find ${GEN_DIR} -name '*_grpc.pyi' -type f); do
  python3 "${SCRIPT_DIR}/postprocess_grpc_stubs.py" "$f"
done
