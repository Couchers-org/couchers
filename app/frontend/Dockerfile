FROM node:14-alpine

WORKDIR /app

COPY . /app

RUN yarn

ARG version
ENV VUE_APP_VERSION=$version

CMD yarn build
