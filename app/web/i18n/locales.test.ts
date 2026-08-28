import { allLanguages } from "i18n/allLanguages";

import {
  ALWAYS_AVAILABLE_LOCALES,
  getLocaleInfos,
  getLocaleReadiness,
  LOCALE_AUTONYMS,
  LocaleReadiness,
} from "./locales";
import { WeblateLanguage } from "./weblate";

describe("LOCALE_AUTONYMS", () => {
  it("has an autonym for every language in allLanguages.js", () => {
    for (const locale of allLanguages) {
      expect(LOCALE_AUTONYMS[locale]).toBeDefined();
    }
  });
});

describe("getLocaleReadiness", () => {
  it("returns JustStarted below 20%", () => {
    expect(getLocaleReadiness(0)).toBe(LocaleReadiness.JustStarted);
    expect(getLocaleReadiness(19)).toBe(LocaleReadiness.JustStarted);
  });

  it("returns EarlyStage from 20% (inclusive) to 50%", () => {
    expect(getLocaleReadiness(20)).toBe(LocaleReadiness.EarlyStage);
    expect(getLocaleReadiness(49)).toBe(LocaleReadiness.EarlyStage);
  });

  it("returns Midway from 50% (inclusive) to 80%", () => {
    expect(getLocaleReadiness(50)).toBe(LocaleReadiness.Midway);
    expect(getLocaleReadiness(79)).toBe(LocaleReadiness.Midway);
  });

  it("returns AlmostDone from 80% (inclusive) to 100%", () => {
    expect(getLocaleReadiness(80)).toBe(LocaleReadiness.AlmostDone);
    expect(getLocaleReadiness(99)).toBe(LocaleReadiness.AlmostDone);
  });

  it("returns Complete at 100%", () => {
    expect(getLocaleReadiness(100)).toBe(LocaleReadiness.Complete);
  });
});

describe("getLocaleInfos", () => {
  it("always includes always-available locales, even with no Weblate data", () => {
    const locales = getLocaleInfos([]);

    for (const code of ALWAYS_AVAILABLE_LOCALES) {
      const locale = locales.find((l) => l.code === code);
      expect(locale).toEqual({
        code,
        autonym: LOCALE_AUTONYMS[code],
        stringAvailabilityPercent: 100,
      });
    }
  });

  it("maps Weblate-sourced languages, converting underscores to hyphens", () => {
    const weblateLanguages: WeblateLanguage[] = [
      { code: "es_419", name: "Spanish (Latin America)", translated_percent: 90 },
    ];

    const locales = getLocaleInfos(weblateLanguages);

    expect(locales).toContainEqual({
      code: "es-419",
      autonym: LOCALE_AUTONYMS["es-419"],
      stringAvailabilityPercent: 90,
    });
  });

  it("excludes Weblate-tracked codes with no known autonym", () => {
    const weblateLanguages: WeblateLanguage[] = [{ code: "xx", name: "Fake", translated_percent: 90 }];

    const locales = getLocaleInfos(weblateLanguages);

    expect(locales.find((l) => l.code === "xx")).toBeUndefined();
  });

  it("lets an always-available locale override a stale/partial Weblate entry for the same code", () => {
    // "en" is always-available; simulate Weblate incorrectly reporting it as partially translated.
    const weblateLanguages: WeblateLanguage[] = [{ code: "en", name: "English", translated_percent: 42 }];

    const locales = getLocaleInfos(weblateLanguages);
    const codes = locales.map((l) => l.code);

    // No duplicate "en" entries.
    expect(codes.filter((code) => code === "en")).toHaveLength(1);
    expect(locales.find((l) => l.code === "en")).toEqual({
      code: "en",
      autonym: LOCALE_AUTONYMS.en,
      stringAvailabilityPercent: 100,
    });
  });
});
