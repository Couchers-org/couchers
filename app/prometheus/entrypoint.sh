#!/bin/sh
/bin/sed -i 's/{GRAFANA_CLOUD_TOKEN}/'$GRAFANA_CLOUD_TOKEN'/' /etc/prometheus/prometheus.yml
/bin/sed -i 's/{PROMETHEUS_ENVIRONMENT}/'$PROMETHEUS_ENVIRONMENT'/' /etc/prometheus/prometheus.yml
/bin/prometheus --config.file=/etc/prometheus/prometheus.yml \
             --storage.tsdb.path=/prometheus \
             --web.console.libraries=/usr/share/prometheus/console_libraries \
             --web.console.templates=/usr/share/prometheus/consoles
