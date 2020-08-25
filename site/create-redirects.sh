#!/bin/bash
while read line; do
  read path loc <<< "$line"
  echo "Redirecting $path to $loc"
  awk '{sub("{{link}}", "'$loc'")}1' redirect.html > redirect-temp.html
  aws s3 cp redirect-temp.html s3://$BUCKET_NAME$path --website-redirect $loc
  rm redirect-temp.html
done < redirects
