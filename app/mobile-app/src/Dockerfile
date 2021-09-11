FROM node:14-alpine

WORKDIR /app

COPY package.json yarn.lock /app/
RUN rm -rf node_modules && yarn --frozen-lockfile

COPY . /app

# promote the version into the container environment for use
# when building/publishing
ARG VERSION='VERSION_NOT_SET'
ENV MOBILE_APP_VERSION=$VERSION

ARG EXPO_ROBOT_TOKEN='EXPO_TOKEN_NOT_SET'
ENV EXPO_TOKEN=$EXPO_ROBOT_TOKEN

# this cmd is not the entry point for ci/cd as gitlab specifies its own.
CMD echo $EXPO_TOKEN