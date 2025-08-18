FROM node:20-bullseye AS runner

WORKDIR /app

RUN npx playwright install
RUN npx playwright install-deps

FROM runner

WORKDIR /app

COPY . .

RUN yarn config set network-timeout 300000
RUN yarn install --frozen-lockfile

CMD ["yarn", "test"]
