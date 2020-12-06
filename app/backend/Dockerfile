FROM python:3.9-buster as base

FROM base as build

WORKDIR /deps
RUN wget http://eradman.com/entrproject/code/entr-4.6.tar.gz \
    && tar xf entr-4.6.tar.gz \
    && cd entr-4.6 \
    && ./configure \
    && make \
    && make install

FROM base

COPY --from=build /usr/local/bin/entr /usr/local/bin/entr

RUN apt-get update && apt-get install -y libgeos-dev

WORKDIR /app

COPY requirements.txt /app
RUN pip install -r requirements.txt

COPY . /app

ARG version
ENV VERSION=$version

CMD python src/app.py
