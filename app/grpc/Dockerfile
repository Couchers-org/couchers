FROM alpine:3 as base

FROM base as build

# build deps
RUN apk add --no-cache cmake git build-base linux-headers

# grpc
WORKDIR /deps
RUN git clone -b v1.30.2 https://github.com/grpc/grpc
WORKDIR /deps/grpc
RUN git submodule update -j 16 --init
WORKDIR /deps/grpc/build
RUN cmake -DgRPC_INSTALL=ON ..
RUN make -j 16
RUN make install

# grpc-web plugin
WORKDIR /deps
RUN git clone -b 1.2.0 https://github.com/grpc/grpc-web
WORKDIR /deps/grpc-web/javascript/net/grpc/web/
RUN make -j 16
RUN make install

FROM base

RUN apk add --no-cache libstdc++

# copy binaries
COPY --from=build /usr/local/bin /usr/local/bin
# copy includes, needed for protobuf imports
COPY --from=build /usr/local/include /usr/local/include
