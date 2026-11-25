import { toAcceptLanguage } from "./acceptLanguage";

describe("toAcceptLanguage", () => {
  it.each([
    [["fr"], "fr"],
    [["pt-BR"], "pt-BR"],
    [["pt-BR", "pt", "en"], "pt-BR,pt;q=0.9,en;q=0.8"],
    [["zh-Hans", "en"], "zh-Hans,en;q=0.9"],
  ])("formats %j as an Accept-Language value", (locales, expected) => {
    expect(toAcceptLanguage(locales)).toBe(expected);
  });

  it("never lets a q-value drop below 0.1", () => {
    const locales = Array.from({ length: 12 }, (_, i) => `l${i}`);
    expect(toAcceptLanguage(locales)?.endsWith("l11;q=0.1")).toBe(true);
  });

  it("returns undefined for an empty list", () => {
    expect(toAcceptLanguage([])).toBeUndefined();
  });
});
