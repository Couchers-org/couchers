FROM nginx:1.19

VOLUME /certs

COPY nginx.conf /etc/nginx/nginx.conf
COPY sites-enabled/ /etc/nginx/sites-enabled/

WORKDIR /scripts

COPY scripts/ ./
COPY domains ./

CMD [ "sh", "-c", "/scripts/run.sh" ]
