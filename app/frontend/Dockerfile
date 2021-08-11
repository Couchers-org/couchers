FROM node:14-alpine

#https://github.com/stereobooster/react-snap/issues/93
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD 1
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium-browser
RUN apk add --no-cache nss
RUN apk add --no-cache chromium

WORKDIR /app

COPY package.json yarn.lock /app/
RUN yarn --frozen-lockfile

COPY . /app

ARG version
ENV REACT_APP_VERSION=$version

RUN yarn build

CMD yarn start
