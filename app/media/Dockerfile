FROM python:3.13-slim-trixie AS base

RUN <<EOT
apt-get update -qy
apt-get install -qyy \
    -o APT::Install-Recommends=false \
    -o APT::Install-Suggests=false \
    libvips42

apt-get clean
rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
EOT

FROM base AS build

ENV UV_VERSION=0.9.8

WORKDIR /app

RUN apt-get update -qy && apt-get install -qyy wget build-essential \
    && wget -qO- https://astral.sh/uv/${UV_VERSION}/install.sh | sh

# Synchronize DEPENDENCIES without the application itself.
# This layer is cached until uv.lock or pyproject.toml change, which are
# only temporarily mounted into the build container since we don't need
# them in the production one.
RUN --mount=type=cache,target=/root/.cache \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    /root/.local/bin/uv sync \
        --locked \
        --no-install-project

# Now install the rest from `/app`: The APPLICATION w/o dependencies.
COPY . /app
RUN --mount=type=cache,target=/root/.cache \
    /root/.local/bin/uv sync \
        --locked \
        --no-editable

FROM base
WORKDIR /app

COPY --from=build /app /app

ENV PATH=/app/.venv/bin:$PATH

ARG MEDIA_SERVER_FROM_ENV=1
ENV MEDIA_SERVER_FROM_ENV=$MEDIA_SERVER_FROM_ENV

ENV MEDIA_UPLOAD_LOCATION="/uploads"

ARG version
ENV VERSION=$version

CMD ["uwsgi", "--http", "[::]:5001", "--wsgi-file", "src/media/server.py", "--callable", "app"]
