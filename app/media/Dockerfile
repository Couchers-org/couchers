FROM python:3.9-buster

RUN apt-get update && apt-get install -y libvips42

WORKDIR /app

COPY requirements.txt /app
RUN pip install -r requirements.txt

COPY . /app

WORKDIR /app

ARG MEDIA_SERVER_FROM_ENV=1
ENV MEDIA_SERVER_FROM_ENV=$MEDIA_SERVER_FROM_ENV

ENV MEDIA_UPLOAD_LOCATION="/uploads"

ARG version
ENV VERSION=$version

CMD cd src && uwsgi --http 0.0.0.0:5000 --wsgi-file media/server.py --callable app
