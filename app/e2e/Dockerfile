FROM node:20-bullseye AS builder

WORKDIR /app

COPY . .

# https://github.com/yarnpkg/yarn/issues/8242
RUN yarn config set network-timeout 300000
RUN yarn install --frozen-lockfile



CMD ["yarn", "test"]
