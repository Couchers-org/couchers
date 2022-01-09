curl -L https://gitlab.com/couchers/couchers/-/jobs/artifacts/develop/download\?job\=protos -o /tmp/protos.zip
unzip /tmp/protos.zip app/web/proto/* -d proto
mv proto/app/web/proto/* proto
