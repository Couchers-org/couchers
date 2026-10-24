import { allLanguages } from "i18n/allLanguages";
import { ALWAYS_AVAILABLE_LOCALES, LOCALE_AUTONYMS } from "i18n/locales";
import {
  classifyTranslationReadiness,
  getLocalePackagedTranslationReadiness,
  TranslationReadiness,
} from "i18n/translationReadiness";

describe("LOCALE_AUTONYMS", () => {
  it("has an autonym for every language in allLanguages.js", () => {
    for (const locale of allLanguages) {
      expect(LOCALE_AUTONYMS[locale]).toBeDefined();
    }
  });
});

describe("classifyTranslationReadiness", () => {
  it("returns JustStarted below 20%", () => {
    expect(classifyTranslationReadiness(0)).toBe(TranslationReadiness.JustStarted);
    expect(classifyTranslationReadiness(19)).toBe(TranslationReadiness.JustStarted);
  });

  it("returns EarlyStage from 20% (inclusive) to 50%", () => {
    expect(classifyTranslationReadiness(20)).toBe(TranslationReadiness.EarlyStage);
    expect(classifyTranslationReadiness(49)).toBe(TranslationReadiness.EarlyStage);
  });

  it("returns Midway from 50% (inclusive) to 80%", () => {
    expect(classifyTranslationReadiness(50)).toBe(TranslationReadiness.Midway);
    expect(classifyTranslationReadiness(79)).toBe(TranslationReadiness.Midway);
  });

  it("returns AlmostDone from 80% (inclusive) to 100%", () => {
    expect(classifyTranslationReadiness(80)).toBe(TranslationReadiness.AlmostDone);
    expect(classifyTranslationReadiness(99)).toBe(TranslationReadiness.AlmostDone);
  });

  it("returns Complete at 100%", () => {
    expect(classifyTranslationReadiness(100)).toBe(TranslationReadiness.Complete);
  });
});

describe("getLocalePackagedTranslationReadiness", () => {
  it("Returns complete for always available locales", () => {
    for (const locale of ALWAYS_AVAILABLE_LOCALES) {
      expect(getLocalePackagedTranslationReadiness(locale)).toEqual(TranslationReadiness.Complete);
    }
  });
});
