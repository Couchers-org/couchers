#!/bin/bash

# get a cert for each domain
for LINE in $(cat /scripts/domains); do
    # if the line has a semicolon, then the second part is the alias domain
    if [[ $LINE == *";"* ]]; then
        DOMAIN="${LINE%%;*}"
        ALIAS_DOMAIN="${LINE##*;}"
    else
        DOMAIN=$LINE
        ALIAS_DOMAIN=""
    fi
    echo "Getting certificate for $DOMAIN, alias=$ALIAS_DOMAIN"

    # if the domain starts with a wildcard, we need slighly different syntax
    regex="^\*\."
    flags="-d $DOMAIN"
    folder=$DOMAIN
    if [[ $DOMAIN =~ $regex ]]; then
        apex=${DOMAIN:2}
        flags="-d $apex -d $DOMAIN"
        folder=$apex
    fi

    # now $flags="-d example.com" or $flags="-d example.com -d *.example.com" (for wildcard certs)
    # and $folder="example.com"

    if [[ -n $ALIAS_DOMAIN ]]; then
        flags="$flags --challenge-alias $ALIAS_DOMAIN"
    fi

    # skip if we already have a cert that's valid for more than 3 days; cron will handle renewals
    CERT_FILE=/certs/live/$folder/fullchain.pem
    if [[ -f $CERT_FILE ]] && openssl x509 -checkend $((3*86400)) -noout -in "$CERT_FILE" >/dev/null 2>&1; then
        echo "Skipping $DOMAIN: existing cert valid for >3 days"
        continue
    fi

    mkdir -p /certs/live/$folder

    /scripts/acme.sh/acme.sh --home /certs --issue --dns dns_aws $flags \
        --keylength ec-256 --server letsencrypt \
        --fullchain-file /certs/live/$folder/fullchain.pem \
        --key-file /certs/live/$folder/privkey.pem
done

/usr/sbin/nginx -s reload
