FROM python:3.8-buster

RUN apt-get update && apt-get install -y libvips42

WORKDIR /app

COPY requirements.txt /app
COPY media-requirements.txt /app
RUN pip install -r requirements.txt -r media-requirements.txt

COPY . /app

WORKDIR /app/src

ENV MEDIA_UPLOAD_LOCATION="/uploads"

CMD uwsgi --http 0.0.0.0:5000 --wsgi-file media_server.py --callable app
