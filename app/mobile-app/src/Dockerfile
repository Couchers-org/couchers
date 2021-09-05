FROM node:14-alpine

WORKDIR /app

COPY package.json yarn.lock /app/
RUN rm -rf node_modules && yarn --frozen-lockfile

COPY . /app

# promote the version into the container environment for use
# when building/publishing
ARG version='VERSION_NOT_SET'
ENV MOBILE_APP_VERSION=$version

CMD expo start