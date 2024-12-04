FROM envoyproxy/envoy:v1.32-latest

COPY ./envoy.yaml /etc/envoy/envoy.yaml
COPY ./descriptors.pb /etc/envoy/descriptors.pb

EXPOSE 8888
EXPOSE 9901

CMD /usr/local/bin/envoy -c /etc/envoy/envoy.yaml
