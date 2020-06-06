# Couchers.org app

## Overview

There's a backend written in Python (in `backend/`), and a frontend written in TypeScript with Vue.js and Vuetify.js for widgets (in `frontend/`).

The frontend is a static app that we can eventually deploy on a CDN. The frontend talks to the backend through gRPC, a Remote Procedure Call library that uses Protocol Buffers, or `protobuf` (in `pb`/). Because of a small incompatibility between the HTTP2-based protocol used in gRPC and the common-place HTTP used on the web, there needs to be a proxy translating the two when using these in the browser. For that there's Envoy proxy (in `proxy/`).

## Local development environment

1. Install [`docker`](https://docs.docker.com/engine/install/)
2. Install [`docker-compose`](https://docs.docker.com/compose/install/)
3. Run `docker-compose up`

This should build everything and launch it up on your computer. It's going to a moment.

Go to <http://localhost:8080/>, and you should see the app there.
