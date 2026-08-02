import dayjs, { i18nToDayjsLocale } from "utils/dayjs";

describe("i18nToDayjsLocale", () => {
  it("formats a long date in the language's locale at the call site", () => {
    // Specify the locale at the formatting site rather than via global state.
    const format = (code: string) => dayjs("2021-03-20").locale(i18nToDayjsLocale(code)).format("LL");

    expect(format("es")).toBe("20 de marzo de 2021");
    expect(format("de")).toBe("20. März 2021");
    expect(format("en")).toBe("March 20, 2021");
  });

  it("maps i18n codes that differ from dayjs locale names", () => {
    // pt-BR -> pt-br
    expect(dayjs("2021-03-20").locale(i18nToDayjsLocale("pt-BR")).format("LL")).toMatch(/mar[çc]o/i);

    // zh-Hans -> zh-cn
    expect(dayjs("2021-03-20").locale(i18nToDayjsLocale("zh-Hans")).format("LL")).toContain("3月");
  });

  it("falls back to the base language, then English, for unmapped codes", () => {
    // base-language fallback: en-US -> en
    expect(i18nToDayjsLocale("en-US")).toBe("en");

    // fully unknown -> en
    expect(i18nToDayjsLocale("xx")).toBe("en");
  });
});
