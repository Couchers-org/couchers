FROM nginx:1.19

RUN apt-get update -y
RUN apt-get install -y cron bash ssl-cert
RUN make-ssl-cert generate-default-snakeoil

VOLUME /etc/certs

COPY nginx.conf /etc/nginx/nginx.conf
COPY sites-enabled/ /etc/nginx/sites-enabled/

WORKDIR /scripts

COPY scripts/ ./
COPY domains ./

CMD [ "sh", "-c", "/scripts/run.sh" ]
