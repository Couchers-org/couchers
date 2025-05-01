FROM prom/prometheus:v3.3.0

ADD prometheus.yml /etc/prometheus
ADD entrypoint.sh /etc/prometheus

WORKDIR /prometheus

ENTRYPOINT [ "/bin/sh", "/etc/prometheus/entrypoint.sh" ]
