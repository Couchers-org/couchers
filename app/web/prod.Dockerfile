# https://nextjs.org/docs/deployment#docker-image

# Install dependencies only when needed
FROM node:alpine
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat git
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ARG environment=production
COPY .env.${environment} .env.production

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
ARG version
ENV NEXT_PUBLIC_VERSION=$version
RUN yarn build && yarn install --production --ignore-scripts --prefer-offline

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node_modules/.bin/next", "start"]
