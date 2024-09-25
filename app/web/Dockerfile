FROM node:20-bullseye AS builder

ARG environment=development
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

ARG version
ENV NEXT_PUBLIC_VERSION=$version

# Get the first 8 characters of the current git commit ID
ARG GIT_COMMIT_ID
RUN echo "Building with commit ID: $GIT_COMMIT_ID"
ARG PROTOS_BASE_URL
RUN echo "PROTOS_BASE_URL: $PROTOS_BASE_URL"

# Copy package.json and yarn.lock, then install dependencies
COPY package.json yarn.lock ./
# https://github.com/yarnpkg/yarn/issues/8242
RUN yarn config set network-timeout 300000
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Fetch and extract the TypeScript protos
RUN echo "Fetching protos from $PROTOS_BASE_URL/ts.tar.gz"
RUN wget $PROTOS_BASE_URL/ts.tar.gz
RUN tar xf ts.tar.gz && rm -f typescript_protos.tar.gz

# Prepare the environment variables for the build
RUN cp .env.$environment env && \
    rm .env.* && \
    mv env .env.local

# Build the application
RUN yarn build
