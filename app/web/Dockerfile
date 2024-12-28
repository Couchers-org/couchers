FROM node:20-bullseye AS builder

ARG environment=development
WORKDIR /app

# disable next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

ARG version
ENV NEXT_PUBLIC_VERSION=$version

COPY package.json yarn.lock ./
# https://github.com/yarnpkg/yarn/issues/8242
RUN yarn config set network-timeout 300000
RUN yarn install --frozen-lockfile

COPY . .

RUN cp .env.$environment env && \
    rm .env.* && \
    mv env .env.local

RUN yarn build
