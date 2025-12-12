
import { getBrowserLocale } from "../middleware";

// Mock allLanguages since it's imported in middleware
jest.mock("../i18n/allLanguages", () => ({
  allLanguages: [
    "en",
    "es",
    "es-419",
    "pt",
    "pt-BR",
    "zh-Hans",
    "zh-Hant"
  ],
}));

describe("getBrowserLocale", () => {
  it("returns undefined if no accept-language header", () => {
    expect(getBrowserLocale(undefined)).toBeUndefined();
    expect(getBrowserLocale("")).toBeUndefined();
  });

  it("returns exact match if available", () => {
    expect(getBrowserLocale("es")).toBe("es");
    expect(getBrowserLocale("en")).toBe("en");
  });

  it("returns most preferred available language", () => {
    // es (q=1), en (q=0.9). es is available.
    expect(getBrowserLocale("es,en;q=0.9")).toBe("es");
    // en (q=1), es (q=0.9). en is available.
    expect(getBrowserLocale("en,es;q=0.9")).toBe("en");
  });

  it("handles region codes correctly when exact match exists", () => {
    expect(getBrowserLocale("pt-BR")).toBe("pt-BR");
    expect(getBrowserLocale("es-419")).toBe("es-419");
  });

  it("falls back to base language if exact interaction is missing but base exists", () => {
    // fr-CA not in our mock list, but let's say we add fr to mock list for this test?
    // Wait, let's see current behavior.
    // In current implementation: "code.split('-')[0]" is used.
    // So "pt-BR" becomes "pt". If "pt" is in allLanguages, it returns "pt".
    // This is the BUG. We WANT "pt-BR" if it exists.

    // For this test, let's use a case that SHOULD fail with current logic if I'm right.
    // "pt-BR" is in allLanguages. "pt" is also in allLanguages.
    // improperly implemented getBrowserLocale will split "pt-BR" to "pt", find "pt", and return "pt".
    // We want "pt-BR".
    expect(getBrowserLocale("pt-BR")).toBe("pt-BR");
  });

  it("falls back to base language if specific region is not supported", () => {
    // es-MX not supported, should fall back to es
    expect(getBrowserLocale("es-MX")).toBe("es");
  });

  it("handles complex quality scores", () => {
    // pt-BR (0.9), pt (0.8), en (0.7)
    expect(getBrowserLocale("pt-BR;q=0.9,pt;q=0.8,en;q=0.7")).toBe("pt-BR");

    // es-MX (1.0), es (0.8) -> es
    expect(getBrowserLocale("es-MX,es;q=0.8")).toBe("es");
  });

  it("prioritizes higher quality match even if lower quality is exact match", () => {
     // If I prefer es-MX (not supported) over en (supported), and es(supported) is fallback
     // es-MX -> fallback es.
     // So result should be es.
     expect(getBrowserLocale("es-MX,en;q=0.5")).toBe("es");
  });
});
