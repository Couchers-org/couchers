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

ENV PROTOS_SHA=1e1dc1cf91c1e41c623bc256747d1534f4949e5fce2b879e44351f6fc51ac854

RUN wget https://protos--by-sha.preview.couchershq.org/$PROTOS_SHA/ts.tar.gz
RUN tar xf ts.tar.gz && rm -f typescript_protos.tar.gz

RUN cp .env.$environment env && \
    rm .env.* && \
    mv env .env.local

RUN yarn build
