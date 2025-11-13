FROM python:3.13-slim-trixie AS base

RUN <<EOT
apt-get update -qy
apt-get install -qyy \
    -o APT::Install-Recommends=false \
    -o APT::Install-Suggests=false \
    libgeos-c1v5

apt-get clean
rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
EOT

FROM base AS build

ENV UV_VERSION=0.9.8

WORKDIR /deps
RUN apt-get update -qy && apt-get install -qyy zstd wget build-essential \
    && wget -q https://eradman.com/entrproject/code/entr-5.6.tar.gz \
    && tar xf entr-5.6.tar.gz \
    && cd entr-5.6 \
    && ./configure \
    && make \
    && make install \
    && cd .. \
    && wget -q https://github.com/Couchers-org/resources/raw/6315b2d500d1113a01f0ea5fb54cd8cf070000b6/timezone_areas/timezone_areas.sql.zst \
    && zstd -d timezone_areas.sql.zst \
    && wget -qO- https://astral.sh/uv/${UV_VERSION}/install.sh | sh

FROM base

COPY --from=build /usr/local/bin/entr /usr/local/bin/entr
COPY --from=build /root/.local/bin/uv /usr/local/bin/uv
COPY --from=build /deps/timezone_areas.sql /app/resources/timezone_areas.sql

WORKDIR /app

# Install dependencies
COPY pyproject.toml uv.lock /app/
RUN uv sync --locked --no-cache --no-install-project

# Install the app itself
COPY . /app
RUN uv sync --locked --no-cache

ARG version
ENV VERSION=$version

ARG display_version
ENV DISPLAY_VERSION=$display_version

ARG commit_sha
ENV COMMIT_SHA=$commit_sha

ARG commit_timestamp
ENV COMMIT_TIMESTAMP=$commit_timestamp

CMD ["uv", "run", "src/app.py"]
