#!/bin/bash

# get a cert for each domain
for domain in $(cat /scripts/domains); do
    echo "Getting certificate for $domain"

    # if the domain starts with a wildcard, we need slighly different syntax
    regex="^\*\."
    flags="-d $domain"
    folder=$domain
    if [[ $domain =~ $regex ]]; then
        apex=${domain:2}
        flags="-d $apex -d $domain"
        folder=$apex
    fi

    # now $flags="-d example.com" or $flags="-d example.com -d *.example.com" (for wildcard certs)
    # and $folder="example.com"

    mkdir -p /certs/live/$folder

    /scripts/acme.sh/acme.sh --home /certs --issue --dns dns_aws $flags --keylength ec-256 \
        --fullchain-file /certs/live/$folder/fullchain.pem \
        --key-file /certs/live/$folder/privkey.pem
done

/usr/sbin/nginx -s reload
