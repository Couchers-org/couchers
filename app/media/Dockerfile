FROM python:3.13-bullseye

RUN apt-get update \
    && apt-get install -y libvips42 \
    && wget -qO- https://astral.sh/uv/${UV_VERSION}/install.sh | sh

# Make sure uv is in PATH
ENV PATH="/root/.local/bin:$PATH"

WORKDIR /app

# Install dependencies
COPY pyproject.toml uv.lock /app/
RUN uv sync --frozen --no-cache --no-install-project

# Install the app itself
COPY . /app
RUN uv sync --frozen --no-cache

ARG MEDIA_SERVER_FROM_ENV=1
ENV MEDIA_SERVER_FROM_ENV=$MEDIA_SERVER_FROM_ENV

ENV MEDIA_UPLOAD_LOCATION="/uploads"

ARG version
ENV VERSION=$version

CMD cd src && uv run uwsgi --http [::]:5001 --wsgi-file media/server.py --callable app
