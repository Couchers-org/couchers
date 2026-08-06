import fs from "fs";
import { allLanguages } from "i18n/allLanguages";
import knownTagMismatches from "i18n/knownTagMismatches";
import { NAMESPACES } from "i18n/namespaces";
import path from "path";

import { extractTags, localeFilePath, tagSignature } from "./transTags";

type Strings = Record<string, string>;

const ROOT = path.resolve(__dirname, "..");

function flatten(node: unknown, prefix = "", into: Strings = {}): Strings {
  for (const [key, value] of Object.entries(node as object)) {
    if (typeof value === "string") into[`${prefix}${key}`] = value;
    else if (value && typeof value === "object") flatten(value, `${prefix}${key}.`, into);
  }
  return into;
}

function loadLocale(namespace: string, locale: string): Strings | null {
  const file = path.join(ROOT, localeFilePath(namespace, locale));
  if (!fs.existsSync(file)) return null;
  return flatten(JSON.parse(fs.readFileSync(file, "utf8")));
}

const english = new Map(NAMESPACES.map((namespace: string) => [namespace, loadLocale(namespace, "en") ?? {}]));

/**
 * Keys whose translation carries different markup to its English source: a tag
 * the call site never passes, a dropped link, an unclosed tag. All of these
 * render as bare text or as a literal `<tag>`, with no error raised.
 */
function tagMismatches(locale: string): string[] {
  const mismatches: string[] = [];
  for (const namespace of NAMESPACES) {
    const strings = loadLocale(namespace, locale);
    if (!strings) continue;
    const source = english.get(namespace) ?? {};

    for (const [key, value] of Object.entries(strings)) {
      if (source[key] === undefined) continue;
      if (tagSignature(source[key]).join() !== tagSignature(value).join()) {
        mismatches.push(`${namespace}/${locale}:${key}`);
      }
    }
  }
  return mismatches;
}

const translatedLanguages = allLanguages.filter((locale: string) => locale !== "en");

describe("tagSignature", () => {
  it("ignores where in the sentence the tags fall", () => {
    expect(tagSignature("Read our <guide>guide</guide> first")).toEqual(tagSignature("<guide>Guide</guide> lesen"));
  });

  it("distinguishes a dropped tag", () => {
    expect(tagSignature("currently <strong>{{email}}</strong>")).not.toEqual(tagSignature("currently {{email}}"));
  });

  it("distinguishes an unclosed tag", () => {
    expect(tagSignature("<2>Learn more</2>.")).not.toEqual(tagSignature("<2>Saiba mais<2>."));
  });

  it("distinguishes a translated tag name", () => {
    expect(tagSignature("our <guidelines>guidelines</guidelines>")).not.toEqual(
      tagSignature("我们的<指南>准则</指南>"),
    );
  });

  it("treats a self-closing tag as needing no closing tag", () => {
    expect(tagSignature("one<br />two")).toEqual(tagSignature("eins<br/>zwei"));
  });
});

describe("extractTags", () => {
  it("returns one entry per opening tag, attributes and all", () => {
    expect(extractTags('a <b>c</b> <1 href="x">d</1> <br/>')).toEqual(["b", "1", "br"]);
  });
});

// See /docs/translation-components.md.
describe("translated strings", () => {
  it.each(translatedLanguages)("%s carries the same markup tags as the English source", (locale: string) => {
    const known = new Set(knownTagMismatches);
    expect(tagMismatches(locale).filter((id) => !known.has(id))).toEqual([]);
  });

  it("has no stale entries in knownTagMismatches", () => {
    const live = new Set(translatedLanguages.flatMap(tagMismatches));
    expect(knownTagMismatches.filter((id) => !live.has(id))).toEqual([]);
  });
});
