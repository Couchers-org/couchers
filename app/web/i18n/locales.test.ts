import { ENGLISH_LOCALES, getFormatLocale } from "i18n/locales";

describe("getFormatLocale", () => {
  it("maps 'en' to the international 'en-001' format locale", () => {
    expect(getFormatLocale("en")).toBe("en-001");
  });

  it("passes through other locales unchanged, including en-US", () => {
    expect(getFormatLocale("en-US")).toBe("en-US");
    expect(getFormatLocale("fr")).toBe("fr");
    expect(getFormatLocale("pt-BR")).toBe("pt-BR");
  });
});

describe("ENGLISH_LOCALES", () => {
  it("includes both English locales", () => {
    expect(ENGLISH_LOCALES).toEqual(["en", "en-US"]);
  });
});
