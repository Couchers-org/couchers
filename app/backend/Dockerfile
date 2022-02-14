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

RUN wget https://github.com/Couchers-org/resources/raw/8c68639a525e2dc85c37d0abb5a6e5a1e12968be/timezone_areas/timezone_areas.sql.zst \
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
