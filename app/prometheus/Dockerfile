FROM prom/prometheus:v2.54.1

ADD prometheus.yml /etc/prometheus
ADD entrypoint.sh /etc/prometheus

WORKDIR /prometheus

ENTRYPOINT [ "/bin/sh", "/etc/prometheus/entrypoint.sh" ]
