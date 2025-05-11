FROM python:3.13-bullseye AS base

RUN apt-get update && apt-get install -y libgeos-c1v5

FROM base AS build

WORKDIR /deps
RUN wget https://eradman.com/entrproject/code/entr-5.6.tar.gz \
    && tar xf entr-5.6.tar.gz \
    && cd entr-5.6 \
    && ./configure \
    && make \
    && make install

RUN apt-get install -y zstd

RUN wget https://github.com/Couchers-org/resources/raw/6315b2d500d1113a01f0ea5fb54cd8cf070000b6/timezone_areas/timezone_areas.sql.zst \
    && zstd -d timezone_areas.sql.zst

FROM base

COPY --from=build /usr/local/bin/entr /usr/local/bin/entr

WORKDIR /app

COPY requirements.txt /app
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

COPY --from=build /deps/timezone_areas.sql /app/resources/timezone_areas.sql

ARG version
ENV VERSION=$version

ARG display_version
ENV DISPLAY_VERSION=$display_version

ARG commit_sha
ENV COMMIT_SHA=$commit_sha

ARG commit_timestamp
ENV COMMIT_TIMESTAMP=$commit_timestamp

CMD python src/app.py
