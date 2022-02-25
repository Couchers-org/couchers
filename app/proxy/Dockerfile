FROM envoyproxy/envoy:v1.21.1

COPY ./envoy.yaml /etc/envoy/envoy.yaml
COPY ./descriptors.pb /tmp/envoy/descriptors.pb

EXPOSE 8888
EXPOSE 9901

CMD /usr/local/bin/envoy -c /etc/envoy/envoy.yaml
