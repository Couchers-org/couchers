FROM node:20-bullseye as builder

ARG environment=development
WORKDIR /app

# disable next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

ARG version
ENV NEXT_PUBLIC_VERSION=$version

COPY package.json yarn.lock ./
# https://github.com/yarnpkg/yarn/issues/8242
RUN yarn config set network-timeout 300000
RUN yarn install --frozen-lockfile

COPY . .

ENV PROTOS_SHA=6b89068325adbee2e413a9553afe13d2e8d5174a7e1703e8ed7d48c7f55fbdcf

RUN wget https://protos--by-sha.preview.couchershq.org/$PROTOS_SHA/ts.tar.gz
RUN tar xf ts.tar.gz && rm -f typescript_protos.tar.gz

RUN cp .env.$environment env && \
    rm .env.* && \
    mv env .env.local

RUN yarn build
