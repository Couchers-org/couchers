import dayjs, { toDayjsLocale } from "utils/dayjs";

describe("toDayjsLocale", () => {
  it("formats a long date in the language's locale at the call site", () => {
    // Specify the locale at the formatting site rather than via global state.
    const format = (code: string) => dayjs("2021-03-20").locale(toDayjsLocale(code)).format("LL");

    expect(format("es")).toBe("20 de marzo de 2021");
    expect(format("de")).toBe("20. März 2021");
    expect(format("en")).toBe("20 March 2021");
    expect(format("en-US")).toBe("March 20, 2021");
  });

  it("maps i18n codes that differ from dayjs locale names", () => {
    // pt-BR -> pt-br
    expect(dayjs("2021-03-20").locale(toDayjsLocale("pt-BR")).format("LL")).toMatch(/mar[çc]o/i);

    // zh-Hans -> zh-cn
    expect(dayjs("2021-03-20").locale(toDayjsLocale("zh-Hans")).format("LL")).toContain("3月");
  });

  it("maps en to en-gb and en-US to dayjs's built-in en", () => {
    expect(toDayjsLocale("en")).toBe("en-gb");
    expect(toDayjsLocale("en-US")).toBe("en");
  });

  it("falls back to the base language, then English, for unmapped codes", () => {
    // fully unknown -> en
    expect(toDayjsLocale("xx")).toBe("en");
  });
});
