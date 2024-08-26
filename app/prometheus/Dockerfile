FROM prom/prometheus:v2.53.2

ADD prometheus.yml /etc/prometheus
ADD entrypoint.sh /etc/prometheus

WORKDIR /prometheus

ENTRYPOINT [ "/bin/sh", "/etc/prometheus/entrypoint.sh" ]
