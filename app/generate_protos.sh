#!/bin/sh
# Generates protobuf bindings and copies them to all source trees that need them.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
make -C "$SCRIPT_DIR/proto"
"$SCRIPT_DIR/copy_generated_protos.sh"

echo "OK"
