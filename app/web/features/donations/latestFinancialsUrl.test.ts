import { LATEST_FINANCIALS_URL } from "@/routes";

describe("Latest financials URL", () => {
  it("should end with valid year digits", () => {
    const yearString = LATEST_FINANCIALS_URL.slice(-4);
    const year = parseInt(yearString);
    expect(year).toBeLessThan(new Date().getFullYear());
    expect(year).toBeGreaterThan(2023);
  });
});
