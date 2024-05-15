FROM node:14-buster as builder

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

ENV PROTOS_SHA=87f07f532c28d2480cced5814849ef2c1c7787a56bbc6c8b00353c858f86b5dc

RUN wget https://protos--by-sha.preview.couchershq.org/$PROTOS_SHA/ts.tar.gz
RUN tar xf ts.tar.gz && rm -f typescript_protos.tar.gz

RUN cp .env.$environment env && \
    rm .env.* && \
    mv env .env.local

RUN yarn build
