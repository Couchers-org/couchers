import { glob } from "glob";
import { allLanguages } from "i18n/allLanguages";

// Support both old and new formats:
// - Old: markdown/<slug>.md (default to 'en')
// - New: markdown/locales/<lang>/<slug>.md
export function getAllMarkdownFiles(): Array<string> {
  const oldFormat = glob.sync("markdown/*.md");
  const oldLangFormat = glob.sync("markdown/*/*.md");
  const newFormat = glob.sync("markdown/locales/*/**/*.md");
  return [...oldFormat, ...oldLangFormat, ...newFormat];
}

/*
Converts filename to { locale, slug } for both formats.
*/
export function filenameToLocaleAndSlug(filename: string) {
  if (!(filename.startsWith("markdown/") && filename.endsWith(".md"))) {
    throw Error(`Invalid filename ${filename}`);
  }
  // New format: markdown/locales/<lang>/<slug>.md
  if (filename.startsWith("markdown/locales/")) {
    const withoutPrefix = filename.substring(
      "markdown/locales/".length,
      filename.length - ".md".length,
    );
    const [locale, ...slugParts] = withoutPrefix.split("/");
    return { locale, slug: slugParts };
  }
  // Old format: markdown/<slug>.md (default to 'en')
  const slug = filename
    .substring("markdown/".length, filename.length - ".md".length)
    .split("/");
  return { locale: "en", slug };
}

// From Next.js documentation:
// https://nextjs.org/docs/pages/guides/internationalization#how-does-this-work-with-static-generation
export function getAllMarkdownPathsWithLocales(): {
  params: { slug: string[] };
  locale: string;
}[] {
  // Collect all unique slugs from all formats
  const files = getAllMarkdownFiles();
  const slugs = new Set();
  for (const file of files) {
    // Use the existing logic to extract slug (ignore locale)
    let slugArr;
    if (file.startsWith("markdown/locales/")) {
      const withoutPrefix = file.substring(
        "markdown/locales/".length,
        file.length - ".md".length,
      );
      const [, ...slugParts] = withoutPrefix.split("/");
      slugArr = slugParts;
    } else if (file.startsWith("markdown/")) {
      const rest = file.substring(
        "markdown/".length,
        file.length - ".md".length,
      );
      const parts = rest.split("/");
      // If old per-language format, skip the first part (the lang)
      if (parts.length > 1 && parts[0].length === 2) {
        slugArr = parts.slice(1);
      } else {
        slugArr = parts;
      }
    }
    slugs.add(JSON.stringify(slugArr));
  }

  const paths = [];
  for (const lang of allLanguages) {
    for (const slugStr of slugs) {
      const slug = JSON.parse(slugStr as string);
      paths.push({ params: { slug }, locale: lang });
    }
  }
  return paths;
}
