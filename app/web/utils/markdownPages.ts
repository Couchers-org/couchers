import glob from "glob";

export function getAllMarkdownFiles(): Array<string> {
  return glob.sync("markdown/**/*.md");
}

/*
Turns

markdown/issues/communities-and-trust.md

into

['issues', 'communities-and-trust']
*/
export function filenameToSlug(filename: string) {
  if (!(filename.startsWith("markdown/") && filename.endsWith(".md"))) {
    throw Error(`Invalid filename ${filename}`);
  }
  return filename
    .substring("markdown/".length, filename.length - ".md".length)
    .split("/");
}

export function getAllMarkdownSlugs(): Array<Array<string>> {
  return getAllMarkdownFiles().map(filenameToSlug);
}
