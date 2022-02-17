FROM python:3.8-buster as base

RUN apt-get update && apt-get install -y libgeos-c1v5

FROM base as build

WORKDIR /deps
RUN wget http://eradman.com/entrproject/code/entr-4.6.tar.gz \
    && tar xf entr-4.6.tar.gz \
    && cd entr-4.6 \
    && ./configure \
    && make \
    && make install

RUN apt-get install -y zstd

RUN wget https://github.com/Couchers-org/resources/raw/a664750dc60771ec5080ac4753d9a27e6ec544b9/timezone_areas/timezone_areas.sql.zst \
    && zstd -d timezone_areas.sql.zst

FROM base

COPY --from=build /usr/local/bin/entr /usr/local/bin/entr

WORKDIR /app

COPY requirements.txt /app
RUN pip install -r requirements.txt

COPY . /app

COPY --from=build /deps/timezone_areas.sql /app/resources/timezone_areas.sql

ARG version
ENV VERSION=$version

CMD python src/app.py
