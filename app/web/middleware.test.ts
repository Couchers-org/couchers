/**
 * Tests for middleware.ts locale detection logic
 *
 * These tests verify the browser language detection and locale resolution
 * functions used by the middleware to determine user's preferred language.
 */

import { allLanguages } from "i18n/allLanguages";
import { getBrowserLocaleFromHeader } from "middleware";

describe("Middleware locale detection logic", () => {
  describe("Browser language detection", () => {
    it("should detect Russian from Accept-Language header", () => {
      const locale = getBrowserLocaleFromHeader("ru-RU,ru;q=0.9,en;q=0.8", allLanguages);
      expect(locale).toBe("ru");
    });

    it("should detect German from Accept-Language header", () => {
      const locale = getBrowserLocaleFromHeader("de-DE,de;q=0.9", allLanguages);
      expect(locale).toBe("de");
    });

    it("should detect Spanish from Accept-Language header", () => {
      const locale = getBrowserLocaleFromHeader("es-ES,es;q=0.9,en;q=0.8", allLanguages);
      expect(locale).toBe("es");
    });

    it("should detect French from Accept-Language header", () => {
      const locale = getBrowserLocaleFromHeader("fr-FR,fr;q=0.9,en;q=0.8", allLanguages);
      expect(locale).toBe("fr");
    });

    it("should detect the right Portuguese variant from Accept-Language header", () => {
      expect(getBrowserLocaleFromHeader("pt-BR,pt,en", allLanguages)).toBe("pt-BR");
      expect(getBrowserLocaleFromHeader("pt,en", allLanguages)).toBe("pt");
    });

    it("should detect the right Chinese variant from Accept-Language header", () => {
      expect(getBrowserLocaleFromHeader("zh-Hans,en", allLanguages)).toBe("zh-Hans");
      expect(getBrowserLocaleFromHeader("zh-Hant,en", allLanguages)).toBe("zh-Hant");
    });
  });

  describe("Fallback to English", () => {
    it("should return undefined for unsupported language", () => {
      expect(getBrowserLocaleFromHeader("xx-XX,xx;q=0.9", allLanguages)).toBeUndefined();
    });

    it("should handle malformed Accept-Language header", () => {
      expect(getBrowserLocaleFromHeader("(╯°□°)╯︵ ┻━┻", allLanguages)).toBeUndefined();
    });

    it("should return undefined when Accept-Language header is missing", () => {
      expect(getBrowserLocaleFromHeader(undefined, allLanguages)).toBeUndefined();
    });

    describe("Locale configuration", () => {
      it("should have English as a supported language", () => {
        expect(allLanguages).toContain("en");
      });

      it("should have common European languages", () => {
        expect(allLanguages).toContain("de"); // German
        expect(allLanguages).toContain("es"); // Spanish
        expect(allLanguages).toContain("fr"); // French
      });

      it("should have Russian as a supported language", () => {
        expect(allLanguages).toContain("ru");
      });

      it("should be an array with multiple languages", () => {
        expect(Array.isArray(allLanguages)).toBe(true);
        expect(allLanguages.length).toBeGreaterThan(5);
      });
    });
  });

  describe("shouldBlockIncompleteLanguage", () => {
    let shouldBlockIncompleteLanguage: (
      currentLocale: string,
      cookieLocale: string | undefined,
      isProductionReady: boolean,
    ) => boolean;

    beforeEach(async () => {
      const middlewareModule = await import("./middleware");
      shouldBlockIncompleteLanguage = middlewareModule.shouldBlockIncompleteLanguage;
    });

    describe("when current locale is English", () => {
      it("should never block English", () => {
        expect(shouldBlockIncompleteLanguage("en", undefined, true)).toBe(false);
        expect(shouldBlockIncompleteLanguage("en", undefined, false)).toBe(false);
        expect(shouldBlockIncompleteLanguage("en", "en", true)).toBe(false);
        expect(shouldBlockIncompleteLanguage("en", "de", true)).toBe(false);
      });
    });

    describe("when cookie exists (manual selection)", () => {
      it("should NOT block incomplete language if user manually selected it", () => {
        // German at 60% - user explicitly chose it
        const result = shouldBlockIncompleteLanguage(
          "de",
          "de", // Cookie exists
          false, // Not production-ready
        );
        expect(result).toBe(false); // Should NOT block
      });

      it("should NOT block production-ready language with cookie", () => {
        // Spanish at 85% - production-ready and manually selected
        const result = shouldBlockIncompleteLanguage(
          "es",
          "es",
          true, // Production-ready
        );
        expect(result).toBe(false); // Should NOT block
      });

      it("should NOT block even if cookie is for different language", () => {
        // Edge case: URL says German, cookie says Spanish
        // This means user has a cookie from previous selection
        const result = shouldBlockIncompleteLanguage(
          "de",
          "es", // Different cookie value
          false,
        );
        expect(result).toBe(false); // Should NOT block (cookie exists)
      });
    });

    describe("when NO cookie (browser auto-detection)", () => {
      it("should block incomplete language when NO cookie", () => {
        // German at 60% - browser detected, not production-ready
        const result = shouldBlockIncompleteLanguage(
          "de",
          undefined, // No cookie
          false, // Not production-ready
        );
        expect(result).toBe(true); // SHOULD block
      });

      it("should NOT block production-ready language when NO cookie", () => {
        // Spanish at 85% - browser detected but production-ready
        const result = shouldBlockIncompleteLanguage(
          "es",
          undefined, // No cookie
          true, // Production-ready
        );
        expect(result).toBe(false); // Should NOT block
      });

      it("should block French at 55% when NO cookie", () => {
        const result = shouldBlockIncompleteLanguage(
          "fr",
          undefined,
          false, // 55% < 80%
        );
        expect(result).toBe(true); // SHOULD block
      });
    });

    describe("critical TDD test cases", () => {
      it("FAILS if cookie check is removed - manual selection of 60% language", () => {
        // This is the bug we're fixing:
        // User selects German (60%) from picker -> sets cookie
        // Without checking cookie, middleware blocks it
        // With cookie check, middleware allows it
        const result = shouldBlockIncompleteLanguage("de", "de", false);
        expect(result).toBe(false); // MUST be false for manual selection
      });

      it("PASSES - browser detection of 60% language blocks correctly", () => {
        // Browser auto-detects German (60%) with no cookie
        // Should block because < 80%
        const result = shouldBlockIncompleteLanguage("de", undefined, false);
        expect(result).toBe(true); // MUST be true for auto-detection
      });
    });
  });
});
