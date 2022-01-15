mkdir -p /tmp/deps
pushd /tmp/deps
curl -L https://github.com/protocolbuffers/protobuf/releases/download/v3.19.3/protoc-3.19.3-linux-x86_64.zip -o protoc.zip
unzip protoc.zip
curl -L https://github.com/grpc/grpc-web/releases/download/1.3.0/protoc-gen-grpc-web-1.3.0-linux-x86_64 -o protoc-gen-grpc-web
chmod +x protoc-gen-grpc-web
popd

cd ..
find proto -name '*.proto' | /tmp/deps/bin/protoc -I /tmp/deps/include -I proto \
  --plugin=protoc-gen-grpc-web=/tmp/deps/protoc-gen-grpc-web \
  \
  --js_out="import_style=commonjs,binary:web/proto" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:web/proto" \
  \
  $(xargs)
