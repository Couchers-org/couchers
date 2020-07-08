find pb -name '*.proto' | protoc -I. \
  --js_out="import_style=commonjs,binary:frontend/src" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcweb:frontend/src" \
  \
  $(xargs)
