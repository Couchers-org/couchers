#!/bin/sh
# Generates protobuf bindings and copies them to all source trees that need them.
# Assumes this is run by CI inside of the GRPC container.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
"$SCRIPT_DIR/proto/generate.sh"
"$SCRIPT_DIR/copy_generated_protos.sh"

echo "OK"
