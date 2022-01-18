FROM nginx:1.21

# 'production' or 'preview'
ARG environment=production

RUN apt-get update -y
RUN apt-get install -y cron bash ssl-cert wget
RUN make-ssl-cert generate-default-snakeoil

VOLUME /certs

COPY nginx.conf /etc/nginx/nginx.conf
COPY sites-enabled/ /etc/nginx/sites-enabled/

WORKDIR /scripts

ENV ACME_SH_VERSION=2.8.8

RUN wget https://github.com/acmesh-official/acme.sh/archive/${ACME_SH_VERSION}.tar.gz \
       && tar xf ${ACME_SH_VERSION}.tar.gz \
       && mv acme.sh-${ACME_SH_VERSION} /scripts/acme.sh

COPY scripts/ ./
COPY domains ./

# copy the proper environment file into the container
COPY .env.${environment} .env
# source it and use sed to substitute the variables in all config files
RUN sh -c ". /scripts/.env && \
       replace=\"s#{API_DOMAIN}#\${API_DOMAIN}#;s#{MEDIA_DOMAIN}#\${MEDIA_DOMAIN}#;s#{WEB_DOMAIN}#\${WEB_DOMAIN}#;s#{MEDIA_CORS_ORIGIN}#\${MEDIA_CORS_ORIGIN}#\" && \
       sed -i \$replace /scripts/domains /etc/nginx/sites-enabled/*"

ARG version
ENV VERSION=$version

CMD [ "sh", "/scripts/run.sh" ]
