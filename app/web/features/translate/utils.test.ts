import { ALMOST_DONE_CUTOFF } from "./constants";
import { getAvailableLanguages, isLanguageProductionReady, WeblateLanguage } from "./utils";

describe("translate/utils", () => {
  describe("isLanguageProductionReady", () => {
    const mockLanguages: WeblateLanguage[] = [
      { code: "en", translated_percent: 100 },
      { code: "es", translated_percent: 95 },
      { code: "fr", translated_percent: 85 },
      { code: "de", translated_percent: 80 },
      { code: "it", translated_percent: 75 },
      { code: "pt", translated_percent: 50 },
      { code: "ru", translated_percent: 30 },
    ];

    it("should return true for English regardless of language data", () => {
      expect(isLanguageProductionReady("en", undefined)).toBe(true);
      expect(isLanguageProductionReady("en", [])).toBe(true);
      expect(isLanguageProductionReady("en", mockLanguages)).toBe(true);
    });

    it("should return true for languages >= 80% translated", () => {
      expect(isLanguageProductionReady("es", mockLanguages)).toBe(true);
      expect(isLanguageProductionReady("fr", mockLanguages)).toBe(true);
      expect(isLanguageProductionReady("de", mockLanguages)).toBe(true);
    });

    it("should return false for languages < 80% translated", () => {
      expect(isLanguageProductionReady("it", mockLanguages)).toBe(false);
      expect(isLanguageProductionReady("pt", mockLanguages)).toBe(false);
      expect(isLanguageProductionReady("ru", mockLanguages)).toBe(false);
    });

    it("should return false when language is not found in stats", () => {
      expect(isLanguageProductionReady("xx", mockLanguages)).toBe(false);
    });

    it("should return false when languages array is undefined", () => {
      expect(isLanguageProductionReady("es", undefined)).toBe(false);
    });

    it("should return false when languages array is empty", () => {
      expect(isLanguageProductionReady("es", [])).toBe(false);
    });

    it("should handle locale format conversion (hyphen to underscore)", () => {
      const languagesWithUnderscore: WeblateLanguage[] = [{ code: "es_419", translated_percent: 90 }];
      expect(isLanguageProductionReady("es-419", languagesWithUnderscore)).toBe(true);
    });

    it("should return false for language exactly at 79%", () => {
      const borderlineLanguages: WeblateLanguage[] = [{ code: "ja", translated_percent: 79 }];
      expect(isLanguageProductionReady("ja", borderlineLanguages)).toBe(false);
    });

    it("should return true for language exactly at 80%", () => {
      const borderlineLanguages: WeblateLanguage[] = [{ code: "ja", translated_percent: 80 }];
      expect(isLanguageProductionReady("ja", borderlineLanguages)).toBe(true);
    });
  });

  describe("getAvailableLanguages", () => {
    const mockLanguages: WeblateLanguage[] = [
      { code: "en", translated_percent: 100 },
      { code: "es", translated_percent: 95 },
      { code: "fr", translated_percent: 85 },
      { code: "de", translated_percent: 75 },
      { code: "it", translated_percent: 55 },
      { code: "pt", translated_percent: 50 },
      { code: "ru", translated_percent: 30 },
      { code: "zh", translated_percent: 15 },
    ];

    it("should return empty array when languages is undefined", () => {
      expect(getAvailableLanguages(undefined)).toEqual([]);
    });

    it("should return empty array when languages is empty", () => {
      expect(getAvailableLanguages([])).toEqual([]);
    });

    it("should filter out languages below 50% translated", () => {
      const result = getAvailableLanguages(mockLanguages);
      const codes = result.map((lang) => lang.code);

      // Should include >= 50%
      expect(codes).toContain("en");
      expect(codes).toContain("es");
      expect(codes).toContain("fr");
      expect(codes).toContain("de");
      expect(codes).toContain("it");
      expect(codes).toContain("pt");

      // Should not include < 50%
      expect(codes).not.toContain("ru");
      expect(codes).not.toContain("zh");
    });

    it("should filter out languages not in LANGUAGE_MAP", () => {
      const languagesWithUnmapped: WeblateLanguage[] = [
        { code: "en", translated_percent: 100 },
        { code: "xx_FAKE", translated_percent: 90 },
      ];

      const result = getAvailableLanguages(languagesWithUnmapped);
      const codes = result.map((lang) => lang.code);

      expect(codes).toContain("en");
      expect(codes).not.toContain("xx_FAKE");
    });

    it("should sort languages with >= 80% first, then alphabetically", () => {
      const result = getAvailableLanguages(mockLanguages);

      // Languages >= 80% should come first
      const highCompleteLanguages = result.filter((lang) => lang.translated_percent >= ALMOST_DONE_CUTOFF);
      const lowerCompleteLanguages = result.filter((lang) => lang.translated_percent < ALMOST_DONE_CUTOFF);

      // Verify >= 80% languages come first
      const firstHighIndex = result.findIndex((lang) => lang.translated_percent >= ALMOST_DONE_CUTOFF);
      const firstLowIndex = result.findIndex((lang) => lang.translated_percent < ALMOST_DONE_CUTOFF);

      if (firstHighIndex >= 0 && firstLowIndex >= 0) {
        expect(firstHighIndex).toBeLessThan(firstLowIndex);
      }

      // Verify alphabetical sorting within each group
      const highCodes = highCompleteLanguages.map((lang) => lang.code);
      expect(highCodes).toEqual([...highCodes].sort());

      const lowCodes = lowerCompleteLanguages.map((lang) => lang.code);
      expect(lowCodes).toEqual([...lowCodes].sort());
    });

    it("should include language exactly at 50% threshold", () => {
      const borderlineLanguages: WeblateLanguage[] = [{ code: "pt", translated_percent: 50 }];

      const result = getAvailableLanguages(borderlineLanguages);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("pt");
    });

    it("should exclude language at 49%", () => {
      const borderlineLanguages: WeblateLanguage[] = [{ code: "pt", translated_percent: 49 }];

      const result = getAvailableLanguages(borderlineLanguages);
      expect(result).toHaveLength(0);
    });
  });
});
