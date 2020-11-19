FROM node:14-alpine

WORKDIR /app

COPY . /app

RUN yarn

ARG version
ENV VUE_APP_VERSION=$version

RUN yarn build

CMD yarn serve
