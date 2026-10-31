FROM envoyproxy/envoy:v1.39-latest@sha256:1fde8efee875e4e4f6a39a90fe49d9338e1caacce5762034ef9fb4bbb9ad6aed

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
