FROM envoyproxy/envoy:v1.34-latest

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

CMD /usr/local/bin/envoy -c /etc/envoy/envoy.yaml
