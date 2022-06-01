####################################################################
# Multi-Stage Docker Image for Couchers Frontend with Next.js
#
# Taken bits for this Dockerfile from various places, for next.js from here
#      See: https://www.koyeb.com/tutorials/how-to-dockerize-and-deploy-a-next-js-application-on-koyeb
#
# WARNING: If you change the Dockerfile, you must update Dockerfile.stage with the first stage or things won't cache
#
#  Original Author: Farley
####################################################################

ARG BUILD_FOR_ENVIRONMENT=development
ARG BUILD_IMAGE=node:14-buster
ARG RUNTIME_IMAGE=node:14-slim

###################################
# First, using a NodeJS builder container build our frontend assets
FROM $BUILD_IMAGE as builder

# Setup
WORKDIR /app
# Next.js collects completely anonymous telemetry data about general usage, disable this
ENV NEXT_TELEMETRY_DISABLED 1

# Install deps for layer caching
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Now copy the source code and build when needed against the env type
ARG BUILD_FOR_ENVIRONMENT
COPY . .
# And add our pre-compiled protos since we won't be updating our backend any more.
#  NOTE: REMOVED this line this doesn't cache reliably from an URL, pre-downloaded into our repo instead
# ADD http://couchers-dev-assets.s3.amazonaws.com/proto_may_27_2022.tar.gz /app/

# Expand our protos into place, set the right env vars into place, then build our static assets
RUN tar -xf proto_may_27_2022.tar.gz && \
    rm -f proto_may_27_2022.tar.gz && \
    cp .env.${BUILD_FOR_ENVIRONMENT} /tmp/saved-temporarily && \
    rm .env.* && \
    mv /tmp/saved-temporarily .env.local && \
    yarn build


###################################
# Second, use a compact runner for quicker deployments / scale-ups / etc
FROM $RUNTIME_IMAGE as runner

# Prepare / Setup / Defaults
WORKDIR /app
# Next.js collects completely anonymous telemetry data about general usage, disable this
ENV NEXT_TELEMETRY_DISABLED 1

# Re-run and install only production/runtime dependencies
#COPY --from=builder /app/package.json ./
#RUN apt-get -y update && \
#    apt-get -y --no-install-recommends install git ca-certificates && \
#    yarn install --production --ignore-scripts --prefer-offline && \
#    apt-get -y remove git && \
#    apt-get -y autoremove && \
#    apt-get -y clean && \
#    rm -rf /var/lib/apt/lists/* && \
#    rm -rf /var/tmp/* && \
#    rm -rf /usr/local/share/.cache

# Instead of above, copy just node modules from our builder
# TODO: This must be done because our "prod" deps aren't enough and cause crashing, someone fix me
#       if you wish to fix me, the issue is an insane random 137 "oom" crash which even with debug logging
#       it doesn't log anything.
COPY --from=builder /app/node_modules ./node_modules

# Copy over needed files
COPY . .
RUN rm .env.*

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/.env.local ./
COPY --from=builder /app/proto ./proto

# This allows next to tell us/users what version this is
ARG IMAGE_TAG=unknown-or-local
ENV NEXT_PUBLIC_VERSION=${IMAGE_TAG}

EXPOSE 3000

CMD ["yarn", "serve"]
