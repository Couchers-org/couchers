curl -L https://gitlab.com/couchers/couchers/-/jobs/artifacts/develop/download\?job\=protos -o /tmp/protos.zip
unzip /tmp/protos.zip app/web/src/proto/* -d proto
mv proto/app/web/src/proto/* proto
