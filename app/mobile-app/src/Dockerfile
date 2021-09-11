FROM node:14-alpine

# promote the version into the container environment for use
# when building/publishing
ARG version='VERSION_NOT_SET'
ENV MOBILE_APP_VERSION=$version

ARG EXPO_ROBOT_TOKEN='EXPO_TOKEN_NOT_SET'
ENV EXPO_TOKEN=$EXPO_ROBOT_TOKEN

WORKDIR /app

COPY package.json yarn.lock /app/
RUN rm -rf node_modules && yarn --frozen-lockfile

COPY . /app



CMD expo start