FROM node:26-bookworm-slim AS builder

ARG environment=development
WORKDIR /app

# disable next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json yarn.lock ./
# https://github.com/yarnpkg/yarn/issues/8242
RUN yarn config set network-timeout 300000 && yarn install --frozen-lockfile && yarn cache clean

COPY . .

RUN cp .env.$environment env && \
    rm .env.* && \
    mv env .env.local

# These are used during yarn build by Next.js
ARG version
ENV NEXT_PUBLIC_VERSION=$version
ENV SENTRY_RELEASE=$version

ARG display_version
ENV NEXT_PUBLIC_DISPLAY_VERSION=$display_version

ARG commit_sha
ENV NEXT_PUBLIC_COMMIT_SHA=$commit_sha

ARG commit_timestamp
ENV NEXT_PUBLIC_COMMIT_TIMESTAMP=$commit_timestamp

RUN yarn build && rm -rf .next/cache node_modules/.cache
