#!/usr/bin/env bash
# Generates the gRPC-Web/JS stubs consumed by the Expo app via the shared
# client-core/couchers package (app/client-core).
# Self-contained (downloads its own protoc/grpc-web) so it can run in environments
# without the full dev toolchain: EAS Build's eas-build-pre-install hook, and as a
# local fallback via `npm run build:protos`. GitLab CI instead generates these stubs
# in the shared `protos` job (app/generate_protos.sh) and ships them as an artifact —
# its OTA/test jobs consume that artifact in place, but EAS cloud native builds
# regenerate the (git-ignored) stubs themselves via the hook.

set -euo pipefail

echo "Generating mobile proto stubs…"

# Resolve repo paths so the script can be run from anywhere.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROTO_SRC="${REPO_ROOT}/proto"
OUT_DIR="${REPO_ROOT}/client-core/couchers/proto"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

if [[ ! -d "${PROTO_SRC}" ]]; then
  echo "Could not find proto directory at ${PROTO_SRC}"
  exit 1
fi

# Detect OS/arch so we download the matching protoc/grpc-web binaries.
OS="$(uname -s)"
ARCH="$(uname -m)"

case "${OS}-${ARCH}" in
  "Linux-x86_64")
    OS_ARCH="linux-x86_64"
    OS_ARCH_GRPC_WEB="linux-x86_64"
    ;;
  "Darwin-arm64")
    OS_ARCH="osx-aarch_64"
    OS_ARCH_GRPC_WEB="darwin-aarch64"
    ;;
  "Darwin-x86_64")
    OS_ARCH="osx-x86_64"
    OS_ARCH_GRPC_WEB="darwin-x86_64"
    ;;
  *)
    echo "Unsupported platform: OS=${OS} ARCH=${ARCH}"
    exit 1
    ;;
esac

# Versions should match backend scripts so the generated stubs stay compatible.
PROTOC_VERSION=27.0
GRPC_WEB_VERSION=1.5.0
PROTOBUF_JS_VERSION=3.21.2

# Download protoc + grpc-web + JS runtime into a temp directory.
DEPS_DIR="${TMP_DIR}/deps"
mkdir -p "${DEPS_DIR}"

curl -sSL "https://github.com/protocolbuffers/protobuf/releases/download/v${PROTOC_VERSION}/protoc-${PROTOC_VERSION}-${OS_ARCH}.zip" -o "${DEPS_DIR}/protoc.zip"
(cd "${DEPS_DIR}" && unzip -qq protoc.zip)
chmod +x "${DEPS_DIR}/bin/protoc"

curl -sSL "https://github.com/grpc/grpc-web/releases/download/${GRPC_WEB_VERSION}/protoc-gen-grpc-web-${GRPC_WEB_VERSION}-${OS_ARCH_GRPC_WEB}" -o "${DEPS_DIR}/protoc-gen-grpc-web"
chmod +x "${DEPS_DIR}/protoc-gen-grpc-web"

curl -sSL "https://github.com/protocolbuffers/protobuf-javascript/releases/download/v${PROTOBUF_JS_VERSION}/protobuf-javascript-${PROTOBUF_JS_VERSION}-${OS_ARCH}.zip" -o "${DEPS_DIR}/protobuf-javascript.zip"
(cd "${DEPS_DIR}" && unzip -qq -o protobuf-javascript.zip)

# Clean output dir before regenerating.
mkdir -p "${OUT_DIR}"
rm -rf "${OUT_DIR:?}"/*

# Gather all proto files relative to repo root.
PROTO_FILES=()
while IFS= read -r rel_path; do
  PROTO_FILES+=("${PROTO_SRC}/${rel_path#./}")
done < <(cd "${PROTO_SRC}" && find . -name '*.proto' -print)

"${DEPS_DIR}/bin/protoc" \
  -I "${DEPS_DIR}/include" \
  -I "${PROTO_SRC}" \
  --plugin=protoc-gen-grpc-web="${DEPS_DIR}/protoc-gen-grpc-web" \
  --plugin=protoc-gen-js="${DEPS_DIR}/bin/protoc-gen-js" \
  --js_out="import_style=commonjs,binary:${OUT_DIR}" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:${OUT_DIR}" \
  "${PROTO_FILES[@]}"

echo "Protos built in ${OUT_DIR}"
