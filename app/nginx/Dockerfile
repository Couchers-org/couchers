FROM nginx:1.19

RUN apt-get update -y
RUN apt-get install -y cron bash ssl-cert wget
RUN make-ssl-cert generate-default-snakeoil

VOLUME /certs

COPY nginx.conf /etc/nginx/nginx.conf
COPY sites-enabled/ /etc/nginx/sites-enabled/

WORKDIR /scripts

RUN wget https://github.com/acmesh-official/acme.sh/archive/2.8.7.tar.gz \
       && tar xf 2.8.7.tar.gz \
       && mv acme.sh-2.8.7 /scripts/acme.sh

COPY scripts/ ./
COPY domains ./

ARG version
ENV VERSION=$version

CMD [ "sh", "/scripts/run.sh" ]
