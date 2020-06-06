FROM envoyproxy/envoy:v1.14.1

COPY ./envoy.yaml /etc/envoy/envoy.yaml

EXPOSE 8888
EXPOSE 9901

CMD /usr/local/bin/envoy -c /etc/envoy/envoy.yaml
