docker build -t couchers/mjml .
for filename in $(ls -1 *.mjml); do
  basename=$(basename "$filename" .mjml)
  echo Generating $basename
  docker run -it --rm -v "$PWD":/app couchers/mjml mjml $filename -o generated_html/$basename.html
done
