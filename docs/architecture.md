# Architecture Overview

## High-level components

![Diagram showing the high-level overview](overview.png)

There's a backend written in Python (in `//app/backend`), and a frontend written in TypeScript with React (in `//app/frontend`).

The frontend is a static app that we deploy on a CDN (AWS CloudFront through an S3 bucket). The frontend talks to the backend through gRPC, a Remote Procedure Call library that uses Protocol Buffers, or protobufs (in `//app/proto`). Because of a small incompatibility between the HTTP2-based protocol used in gRPC and the common-place HTTP used on the web, there needs to be a proxy translating the two when using these in the browser. For that there's Envoy proxy (in `//app/proxy`).

User media is uploaded to the media server (in `//app/media`). It's built into a different container and will eventually run on a different machine. The purpose is to isolate user content (which can potentially be arbitrary user content) from the main server. It's also served off a different domain for cookie protection and CSP reasons.

Everything's built into docker containers and can be spun up together with `docker-compose`. This gives us an easy way to deploy the app, as well as some isolation and reproducibility afforded by containerisation.

The `//app/nginx` and `//app/deployment` folders contain stuff to deploy this. The app is literally composed of stuff in this repo and a few config files dropped in `//app`. `//app/deployment/deps.sh` should basically install all dependencies. You'd need to tweak the `nginx` container though and rebuild the containers if you wanted to deploy on a different domain though.
