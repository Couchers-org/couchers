#!/bin/sh
# Called inside the grpc container to generate protos
# and copy them to source trees needing them.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
"$SCRIPT_DIR/proto/generate.sh"
"$SCRIPT_DIR/copy_generated_protos.sh"

echo "OK"
