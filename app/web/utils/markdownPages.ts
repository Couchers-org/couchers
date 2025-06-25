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

export function getAllMarkdownPathsWithLocales(): {
  params: { slug: string[] };
  locale: string;
}[] {
  const baseSlugs = getAllMarkdownFiles().map(filenameToSlug);

  // console.log("Base slugs:", baseSlugs);

  // Combine each slug with all languages
  const paths = [];

  for (const lang of allLanguages) {
    for (const slug of baseSlugs) {
      // console.log("Combining language", lang, "with slug", slug);
      paths.push({ params: { slug }, locale: lang });
    }
  }

  // console.log("Localized slugs:", localizedSlugs);

  return paths;
}
