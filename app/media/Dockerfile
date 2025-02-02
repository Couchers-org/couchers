FROM python:3.13-bullseye

RUN apt-get update && apt-get install -y libvips42

WORKDIR /app

COPY requirements.txt /app
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

WORKDIR /app

ARG MEDIA_SERVER_FROM_ENV=1
ENV MEDIA_SERVER_FROM_ENV=$MEDIA_SERVER_FROM_ENV

ENV MEDIA_UPLOAD_LOCATION="/uploads"

ARG version
ENV VERSION=$version

CMD cd src && uwsgi --http [::]:5001 --wsgi-file media/server.py --callable app
