FROM python:3.14-slim-trixie AS base

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

ENV UV_VERSION=0.9.10

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

WORKDIR /app

# Copy lockfile and pyproject.toml for dependency resolution, then regenerate
# lockfile for current Python version (to ensure compatible wheels) and sync.
COPY uv.lock pyproject.toml /app/
RUN --mount=type=cache,target=/root/.cache \
    /root/.local/bin/uv lock --upgrade && \
    /root/.local/bin/uv sync \
        --frozen \
        --no-install-project

# Now install the rest from `/app`: The APPLICATION w/o dependencies.
COPY . /app
RUN --mount=type=cache,target=/root/.cache \
    /root/.local/bin/uv sync \
        --frozen \
        --no-editable

# We don't need uv.lock in the final image (it's more than 300Kb!)
RUN rm /app/uv.lock

FROM base

COPY --from=build /usr/local/bin/entr /usr/local/bin/entr
COPY --from=build /deps/timezone_areas.sql /app/resources/timezone_areas.sql
COPY --from=build /app /app

WORKDIR /app

# make sure virtualenv binaries are on PATH
ENV PATH=/app/.venv/bin:$PATH

ARG version
ENV VERSION=$version

ARG display_version
ENV DISPLAY_VERSION=$display_version

ARG commit_sha
ENV COMMIT_SHA=$commit_sha

ARG commit_timestamp
ENV COMMIT_TIMESTAMP=$commit_timestamp

CMD ["python", "src/app.py"]
