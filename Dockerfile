# https://nextjs.org/docs/deployment#docker-image

# Install dependencies only when needed
FROM node:14.19.0-alpine

# https://github.com/yarnpkg/yarn/issues/8242
RUN yarn config set network-timeout 300000

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat git
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
COPY . .
RUN rm .env.* || true
ARG environment=production
ARG version
COPY .env.${environment} .env.local
ENV NEXT_PUBLIC_VERSION=$version

EXPOSE 3000
ENV PORT 3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED 1

CMD ["/bin/sh", "-c", "node_modules/.bin/next dev"]
