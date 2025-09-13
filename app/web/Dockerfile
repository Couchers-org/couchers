FROM node:20-bullseye AS builder

ARG environment=development
WORKDIR /app

# disable next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

ARG version
ENV NEXT_PUBLIC_VERSION=$version
ENV SENTRY_RELEASE=$version

ARG display_version
ENV NEXT_PUBLIC_DISPLAY_VERSION=$display_version

ARG commit_sha
ENV NEXT_PUBLIC_COMMIT_SHA=$commit_sha

ARG commit_timestamp
ENV NEXT_PUBLIC_COMMIT_TIMESTAMP=$commit_timestamp

COPY package.json yarn.lock ./

RUN corepack enable
RUN yarn install --frozen-lockfile

COPY . .

RUN cp .env.$environment env && \
    rm .env.* && \
    mv env .env.local

RUN yarn build
