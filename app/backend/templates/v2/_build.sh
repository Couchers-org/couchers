docker build -f _Dockerfile -t couchers/mjml .
for filename in $(find . -maxdepth 1 -type f -name "*.mjml"); do
  basename=$(basename "$filename" .mjml)
  echo Generating $basename
  docker run --rm -v "$PWD":/app couchers/mjml mjml $filename -o generated_html/$basename.html
done
