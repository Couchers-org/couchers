FROM envoyproxy/envoy:v1.15.0

COPY ./envoy.yaml /etc/envoy/envoy.yaml
COPY ./protos.pb /tmp/envoy/protos.pb

EXPOSE 8888
EXPOSE 9901

CMD /usr/local/bin/envoy -c /etc/envoy/envoy.yaml
