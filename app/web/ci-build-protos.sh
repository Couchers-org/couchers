# download deps
mkdir -p /tmp/deps
pushd /tmp/deps

curl -L https://github.com/protocolbuffers/protobuf/releases/download/v27.0/protoc-27.0-linux-x86_64.zip -o protoc.zip
unzip protoc.zip

curl -L https://github.com/grpc/grpc-web/releases/download/1.5.0/protoc-gen-grpc-web-1.5.0-linux-x86_64 -o protoc-gen-grpc-web
chmod +x protoc-gen-grpc-web

curl -L https://github.com/protocolbuffers/protobuf-javascript/releases/download/v3.21.2/protobuf-javascript-3.21.2-linux-x86_64.zip -o protobuf-javascript.zip
unzip protobuf-javascript.zip

popd

# actually build the protos
cd ..
mkdir -p web/proto/
find proto -name '*.proto' | /tmp/deps/bin/protoc -I /tmp/deps/include -I proto \
  --plugin=protoc-gen-grpc-web=/tmp/deps/protoc-gen-grpc-web \
  --plugin=protoc-gen-js=/tmp/deps/bin/protoc-gen-js \
  \
  --js_out="import_style=commonjs,binary:web/proto" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:web/proto" \
  \
  $(xargs)
