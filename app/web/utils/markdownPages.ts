import { glob } from "glob";
import { allLanguages } from "i18n/allLanguages";

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

// From Next.js documentation:
// https://nextjs.org/docs/pages/guides/internationalization#how-does-this-work-with-static-generation
export function getAllMarkdownPathsWithLocales(): {
  params: { slug: string[] };
  locale: string;
}[] {
  const baseSlugs = getAllMarkdownFiles().map(filenameToSlug);

  const paths = [];

  for (const lang of allLanguages) {
    for (const slug of baseSlugs) {
      paths.push({ params: { slug }, locale: lang });
    }
  }

  return paths;
}
