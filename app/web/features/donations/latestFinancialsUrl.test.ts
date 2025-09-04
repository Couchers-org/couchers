import { latestFinancialsURL } from "@/routes";

describe("Latest financials URL", () => {
  it("should end with valid year digits", () => {
    const yearString = latestFinancialsURL.slice(-4);
    const year = parseInt(yearString);
    expect(year).toBeLessThan(new Date().getFullYear());
    expect(year).toBeGreaterThan(2023);
  });
});
