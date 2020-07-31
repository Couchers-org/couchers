FROM ubuntu:20.04

# stops it from asking you where you are
ENV DEBIAN_FRONTEND=noninteractive
# build deps
RUN apt-get update && apt-get install -y pkg-config cmake git clang

# grpc
WORKDIR /deps
RUN git clone -b v1.30.2 https://github.com/grpc/grpc
WORKDIR /deps/grpc
RUN git submodule update -j 6 --init
WORKDIR /deps/grpc/build
RUN cmake -DgRPC_INSTALL=ON ..
RUN make -j 16
RUN make install

# grpc-web plugin
WORKDIR /deps
RUN git clone -b 1.2.0 https://github.com/grpc/grpc-web
WORKDIR /deps/grpc-web/javascript/net/grpc/web/
RUN CXX=clang++ make -j 16
RUN make install
