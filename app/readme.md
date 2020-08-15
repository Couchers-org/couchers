# Couchers.org app

## Overview

There's a backend written in Python (in `backend/`), and a frontend written in TypeScript with Vue.js and Vuetify.js for widgets (in `frontend/`).

The frontend is a static app that we can eventually deploy on a CDN. The frontend talks to the backend through gRPC, a Remote Procedure Call library that uses Protocol Buffers, or `protobuf` (in `pb`/). Because of a small incompatibility between the HTTP2-based protocol used in gRPC and the common-place HTTP used on the web, there needs to be a proxy translating the two when using these in the browser. For that there's Envoy proxy (in `proxy/`).

## Local development environment

1. Install [`docker`](https://docs.docker.com/engine/install/)
2. Install [`docker-compose`](https://docs.docker.com/compose/install/)
3. Navigate in your command line to your folder containing "\backend" and run `docker-compose up`

This should build everything and launch it up on your computer. It's going to a moment.

Go to <http://localhost:8080/>, and you should see the app there.

## Building protobufs

We don't keep the generated code for our `.proto` files in git to minimise clutter and reduce merge conflicts. To generate these you need [gRPC](https://github.com/grpc/grpc/) and [gRPC-Web](https://github.com/grpc/grpc-web/).

### The Docker method

To help you get up and running, we've created a docker container that has the latest versions of gRPC and gRPC-Web. To build it, run:

```sh
cd couchers/app/grpc
docker build -t couchers/grpc .
```

This will take quite a while as it's rebuilding gRPC from scratch. You might want to delete the intermediate containers which will be quite large. It uses multi-stage builds to minimise container size.

You can then compile protos with:

```sh
cd couchers/app
docker run --rm -w /app -v $(pwd):/app couchers/grpc ./generate_protos.sh
```

On Windows, you will have to instead use this command in the command line (not powershell):

```sh
cd couchers/app
docker run --rm -w /app -v %cd%:/app couchers/grpc sh -c "cat generate_protos.sh | dos2unix | sh"
```

This creates an ephemeral container (`--rm`), with working directory being `/app`, mounting the current directory into there, and running `generate_protos.sh`.

### macOS

On macOS it's super easy to `brew install grpc`, I think you have to install the [latest release](https://github.com/grpc/grpc-web/releases/latest) of gRPC-Web though.
