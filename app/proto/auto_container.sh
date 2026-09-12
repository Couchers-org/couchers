#!/bin/sh
# Runs a command in the GRPC container, or directly if all dependencies are installed locally.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
PROTO_IMAGE=registry.gitlab.com/couchers/grpc

if command -v protoc >/dev/null 2>&1 && command -v grpc_python_plugin >/dev/null 2>&1; then
  "$@"
elif command -v docker >/dev/null 2>&1; then
  docker pull -q "${PROTO_IMAGE}"
  docker run --rm -v "${SCRIPT_DIR}:/app" -w /app "${PROTO_IMAGE}" "$@"
else
  echo "error: neither protoc/grpc_python_plugin nor docker is installed" >&2
  exit 1
fi
