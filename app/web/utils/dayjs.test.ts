import dayjs, { i18nToDayjsLocale } from "utils/dayjs";

describe("i18nToDayjsLocale", () => {
  it("formats a long date in the language's locale at the call site", () => {
    // Specify the locale at the formatting site rather than via global state.
    const format = (code: string) => dayjs("2021-03-20").locale(i18nToDayjsLocale(code)).format("LL");

    expect(format("es")).toBe("20 de marzo de 2021");
    expect(format("de")).toBe("20. März 2021");
    expect(format("en")).toBe("20 March 2021");
    expect(format("en-US")).toBe("March 20, 2021");
  });

  it("maps i18n codes that differ from dayjs locale names", () => {
    // en -> en-gb (international date conventions)
    expect(i18nToDayjsLocale("en")).toBe("en-gb");
    // en-US -> en (US date conventions)
    expect(i18nToDayjsLocale("en-US")).toBe("en");

    const ptBR = i18nToDayjsLocale("pt-BR");
    expect(ptBR).toBe("pt-br");
    expect(dayjs("2021-03-20").locale(ptBR).format("LL")).toMatch(/mar[çc]o/i);

    const zhHans = i18nToDayjsLocale("zh-Hans");
    expect(zhHans).toBe("pt-cn");
    expect(dayjs("2021-03-20").locale(zhHans).format("LL")).toContain("3月");
  });

  it("falls back to the base language, then English, for unmapped codes", () => {
    expect(i18nToDayjsLocale("de-DE")).toBe("de");
    expect(i18nToDayjsLocale("xx")).toBe("en");
  });
});
