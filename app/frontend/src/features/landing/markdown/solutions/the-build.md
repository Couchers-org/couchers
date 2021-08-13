---
title: Building it Right
subtitle: "Our plan to fix the problem of [the Bugs and app issues](/issues/the-build)"
crumb: Building it right
url: solutions/the-build
---

<span class="tag is-danger is-large">Technology</span>

We have yet to finalize the full software architecture, but the general plan is to use proven technologies to build a robust, scalable design that will maximize developer velocity while allowing us to optimize the physical backend configuration to reduce hosting costs. **We will implement this with modern development practices such as code review, unit testing, and CI/CD to minimize both the number of bugs that slip into the codebase, as well as allowing a larger number of less experienced developers to contribute small bugfixes and features.**

The platform will be divided into two parts: the backend and a frontend. The backend will be responsible for the processing and storage of user data as well as asynchronous tasks such as sending emails and performing long-running maintenance tasks. The frontend will be a lightweight single page app that runs on the client's browser and talks to the backend through RPC API calls.

The backend will be written in Python and use gRPC for API calls. These will interface to a PostgreSQL database, and be reverse proxied and load balanced through an nginx instance. This allows us to conveniently use the same backend for both web and mobile apps.

The frontend will be written in TypeScript with React, and an appropriate widget framework. An additional gRPC web proxy will proxy calls from the web frontend.

This setup should easily last us well into the first couple of hundred thousand active users. **Once we begin to scale the service beyond that, there are a variety of steps we can take**, such as provisioning geographically distributed middleware servers to front TLS connections and send preprocessed RPC requests to the central server with the master database. This, along with larger servers, should easily scale for another while. If there is need for additional server-side rendering, we will build a middleware layer fronted by these local servers.

We are still investigating various technologies for our geo needs, a very important aspect of the site. One solution initially would be to rely on OpenStreetMaps, and later move onto a self-hosted instance, though this would come with higher setup and maintenance requirements. Another option would be using the MapBox APIs (or Google Maps while we remain within the free tier).

For now, we will deploy the stack onto Amazon Web Services with Kubernetes. At the moment, the full setup will easily run on the smallest instance types, after which we will start profiling performance and deciding on how to proceed. At some point it might be worth considering other hosting solutions, in particular once there starts being a large amount of high-bandwidth user content and media, it might be worth investigating providers that do not charge so high fees for egress data transfer.

It is no doubt that we will make many changes to this plan in the future and before everything is built, but **we believe it's important to remain transparent and show people that we are serious and have a concrete plan.**
