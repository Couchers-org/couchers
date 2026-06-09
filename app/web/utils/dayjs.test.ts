import dayjs, { setDayjsLocale } from "utils/dayjs";

describe("setDayjsLocale", () => {
  afterEach(() => {
    setDayjsLocale("en");
  });

  it("localizes dayjs long-date output to the app language", () => {
    setDayjsLocale("es");
    expect(dayjs("2021-03-20").format("LL")).toBe("20 de marzo de 2021");

    setDayjsLocale("de");
    expect(dayjs("2021-03-20").format("LL")).toBe("20. März 2021");

    setDayjsLocale("en");
    expect(dayjs("2021-03-20").format("LL")).toBe("March 20, 2021");
  });

  it("maps i18n codes that differ from dayjs locale names", () => {
    // pt-BR -> pt-br
    setDayjsLocale("pt-BR");
    expect(dayjs("2021-03-20").format("LL")).toMatch(/mar[çc]o/i);

    // zh-Hans -> zh-cn
    setDayjsLocale("zh-Hans");
    expect(dayjs("2021-03-20").format("LL")).toContain("3月");
  });

  it("falls back to the base language, then English, for unmapped codes", () => {
    // base-language fallback: en-US -> en
    setDayjsLocale("en-US");
    expect(dayjs.locale()).toBe("en");

    // fully unknown -> en
    setDayjsLocale("xx");
    expect(dayjs.locale()).toBe("en");
  });
});
