import { lookupAcceptLanguage, parseAcceptLanguage } from "i18n/acceptLanguage";

describe("parseAcceptLanguage", () => {
  it("parses correctly", () => {
    const entries = parseAcceptLanguage("fr-FR,fr;q=0.75,en;q=0.5");
    expect(entries).toHaveLength(3);
    expect(entries[0].code).toBe("fr-FR");
    expect(entries[0].quality).toBe(1);
    expect(entries[1].code).toBe("fr");
    expect(entries[1].quality).toBe(0.75);
    expect(entries[2].code).toBe("en");
    expect(entries[2].quality).toBe(0.5);
  });
});

describe("chooseAcceptLanguage", () => {
  it("should find the first exact match", () => {
    const locale = lookupAcceptLanguage("fr,es,en", ["es", "en"]);
    expect(locale).toBe("es");
  });

  it("should honor quality weights", () => {
    const locale = lookupAcceptLanguage("fr;q=0.5,en;q=1", ["fr", "en"]);
    expect(locale).toBe("en");
  });

  it("should default to quality = 1", () => {
    const locale = lookupAcceptLanguage("fr;q=0.5,en", ["fr", "en"]);
    expect(locale).toBe("en");
  });

  it("should fallback to simpler locales on a per-entry basis", () => {
    const locale = lookupAcceptLanguage("fr-CA,fr-FR", ["fr", "fr-FR"]);
    expect(locale).toBe("fr");
  });

  it("should handle invalid locales", () => {
    expect(lookupAcceptLanguage("xx", ["en"])).toBe(undefined);
    expect(lookupAcceptLanguage("klingon", ["en"])).toBe(undefined);
    expect(lookupAcceptLanguage("a-b-c", ["en"])).toBe(undefined);
  });

  it("should handle bad syntax", () => {
    expect(lookupAcceptLanguage("", ["en"])).toBe(undefined);
    expect(lookupAcceptLanguage(" ", ["en"])).toBe(undefined);
    expect(lookupAcceptLanguage(",,", ["en"])).toBe(undefined);
    expect(lookupAcceptLanguage(";;", ["en"])).toBe(undefined);
  });
});
