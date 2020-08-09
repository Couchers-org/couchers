FROM python:3.8-buster

RUN apt-get update && apt-get install -y libvips42

WORKDIR /app

COPY requirements.txt /app
COPY media-requirements.txt /app
RUN pip install -r requirements.txt -r media-requirements.txt

COPY . /app

WORKDIR /app/src

ENV FLASK_ENV=development
ENV FLASK_APP=src/media_server.py
ENV MEDIA_SERVER_SECRET_KEY=1c40f0f493eea6e0c2dec15c8c1d32c25f2f4b4dacf3a7a255d8d2ab56fa9677
ENV MEDIA_SERVER_BEARER_TOKEN=aabbcbaa02883911
ENV MAIN_SERVER_ADDRESS="localhost:1753"
ENV MAIN_SERVER_USE_SSL=0
ENV MEDIA_UPLOAD_LOCATION="media_testing/"

CMD uwsgi --http 0.0.0.0:5000 --wsgi-file media_server.py --callable app
