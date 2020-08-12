FROM python:3.8-buster

RUN apt-get update && apt-get install -y libvips42

WORKDIR /app

COPY requirements.txt /app
RUN pip install -r requirements.txt

COPY . /app

WORKDIR /app/src

ARG MEDIA_SERVER_FROM_ENV=1
ENV MEDIA_SERVER_FROM_ENV=$MEDIA_SERVER_FROM_ENV

ENV MEDIA_UPLOAD_LOCATION="/uploads"

CMD uwsgi --http 0.0.0.0:5000 --wsgi-file server.py --callable app
