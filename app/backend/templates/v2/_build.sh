docker build -f _Dockerfile -t couchers/mjml .
mkdir _temp
for filename in $(find . -maxdepth 1 -type f -name "*.mjml" ! -name "_*.mjml"); do
  basename=$(basename "$filename" .mjml)
  echo Generating $basename
  cat _header.mjml > _temp/$filename
  cat $filename >> _temp/$filename
  cat _footer.mjml >> _temp/$filename
  docker run -it --rm -v "$PWD":/app couchers/mjml mjml _temp/$filename -o generated_html/$basename.html
done
