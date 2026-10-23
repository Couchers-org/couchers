import { allLanguages } from "i18n/allLanguages";
import { ALWAYS_AVAILABLE_LOCALES, LOCALE_AUTONYMS } from "i18n/locales";
import {
  getLocalePackagedTranslationReadiness,
  translationProgressToReadiness,
  TranslationReadiness,
} from "i18n/translationReadiness";

describe("LOCALE_AUTONYMS", () => {
  it("has an autonym for every language in allLanguages.js", () => {
    for (const locale of allLanguages) {
      expect(LOCALE_AUTONYMS[locale]).toBeDefined();
    }
  });
});

describe("translationProgressToReadiness", () => {
  it("returns JustStarted below 20%", () => {
    expect(translationProgressToReadiness(0)).toBe(TranslationReadiness.JustStarted);
    expect(translationProgressToReadiness(19)).toBe(TranslationReadiness.JustStarted);
  });

  it("returns EarlyStage from 20% (inclusive) to 50%", () => {
    expect(translationProgressToReadiness(20)).toBe(TranslationReadiness.EarlyStage);
    expect(translationProgressToReadiness(49)).toBe(TranslationReadiness.EarlyStage);
  });

  it("returns Midway from 50% (inclusive) to 80%", () => {
    expect(translationProgressToReadiness(50)).toBe(TranslationReadiness.Midway);
    expect(translationProgressToReadiness(79)).toBe(TranslationReadiness.Midway);
  });

  it("returns AlmostDone from 80% (inclusive) to 100%", () => {
    expect(translationProgressToReadiness(80)).toBe(TranslationReadiness.AlmostDone);
    expect(translationProgressToReadiness(99)).toBe(TranslationReadiness.AlmostDone);
  });

  it("returns Complete at 100%", () => {
    expect(translationProgressToReadiness(100)).toBe(TranslationReadiness.Complete);
  });
});

describe("getLocalePackagedTranslationReadiness", () => {
  it("Returns complete for always available locales", () => {
    for (const locale of ALWAYS_AVAILABLE_LOCALES) {
      expect(getLocalePackagedTranslationReadiness(locale)).toEqual(TranslationReadiness.Complete);
    }
  });
});
