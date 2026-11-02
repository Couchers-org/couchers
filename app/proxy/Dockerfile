FROM envoyproxy/envoy:v1.40-latest@sha256:8de97e654644827d62afdbf7e1d3dc9fee01a8690d410dd1c63a30dc6b6cecbb

COPY ./envoy.yaml /etc/envoy/envoy.yaml
COPY ./descriptors.pb /etc/envoy/descriptors.pb

EXPOSE 8888
EXPOSE 9901

ARG display_version
ENV DISPLAY_VERSION=$display_version

ARG commit_sha
ENV COMMIT_SHA=$commit_sha

ARG commit_timestamp
ENV COMMIT_TIMESTAMP=$commit_timestamp

CMD ["/usr/local/bin/envoy", "-c", "/etc/envoy/envoy.yaml"]
