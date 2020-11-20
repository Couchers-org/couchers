#!/bin/bash

/scripts/get-certs.sh

# start cron to automatically renew certs every 5 days
touch /var/log/get-certs.log
echo "47 5 */5 * * root /scripts/get-certs.sh >> /var/log/get-certs.log 2>&1" > /etc/cron.d/get-certs
cron -f &
# get output here
tail -f /var/log/get-certs.log &

echo "Done initialization, starting nginx"

nginx -g 'daemon off;'
