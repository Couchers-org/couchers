#!/bin/bash

# this needs to run on both android (linux) and ios (osx) builds

OS=$(uname -s)
# Determine the architecture
ARCH=$(uname -m)

OS_ARCH=""
# for some reason protoc-gen-grpc-web uses "darwin" instead of "osx"
OS_ARCH_GRPC_WEB=""

echo "Running on OS=$OS, ARCH=$ARCH"

if [[ "$OS" == "Linux" && "$ARCH" == "x86_64" ]]; then
    OS_ARCH="linux-x86_64"
    OS_ARCH_GRPC_WEB="linux-x86_64"
elif [[ "$OS" == "Darwin" && "$ARCH" == "arm64" ]]; then
    OS_ARCH="osx-aarch_64"
    OS_ARCH_GRPC_WEB="darwin-aarch64"
elif [[ "$OS" == "Darwin" && "$ARCH" == "x86_64" ]]; then
    OS_ARCH="osx-x86_64"
    OS_ARCH_GRPC_WEB="darwin-x86_64"
else
    echo "Not one of the known builders!"
    exit 1
fi

echo "Using OS/arch: $OS_ARCH"

PROTOC_VERSION=27.0
GRPC_WEB_VERSION=1.5.0
PROTOBUF_JS_VERSION=3.21.2

# download deps
mkdir -p /tmp/deps
pushd /tmp/deps

curl -L https://github.com/protocolbuffers/protobuf/releases/download/v$PROTOC_VERSION/protoc-$PROTOC_VERSION-$OS_ARCH.zip -o protoc.zip
unzip protoc.zip
chmod +x bin/protoc

curl -L https://github.com/grpc/grpc-web/releases/download/$GRPC_WEB_VERSION/protoc-gen-grpc-web-$GRPC_WEB_VERSION-$OS_ARCH_GRPC_WEB -o protoc-gen-grpc-web
chmod +x protoc-gen-grpc-web

curl -L https://github.com/protocolbuffers/protobuf-javascript/releases/download/v$PROTOBUF_JS_VERSION/protobuf-javascript-$PROTOBUF_JS_VERSION-$OS_ARCH.zip  -o protobuf-javascript.zip
unzip -o protobuf-javascript.zip

popd

# actually build the protos
cd ..
mkdir -p native/proto/
find proto -name '*.proto' | /tmp/deps/bin/protoc -I /tmp/deps/include -I proto \
  --plugin=protoc-gen-grpc-web=/tmp/deps/protoc-gen-grpc-web \
  --plugin=protoc-gen-js=/tmp/deps/bin/protoc-gen-js \
  \
  --js_out="import_style=commonjs,binary:native/proto" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:native/proto" \
  \
  $(xargs)

echo "Protos built!"
