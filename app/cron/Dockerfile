FROM node:14-alpine

# copy crontabs for root user
COPY cronjobs /etc/crontabs/root

# start crond with log level 8 in foreground, output to stderr
CMD ["crond", "-f", "-d", "8"]
