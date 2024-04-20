import hasAtLeastOnePage from "./hasAtLeastOnePage";

describe("hasAtLeastOnePage", () => {
  it("should return false if data is undefined", () => {
    const infiniteData = undefined;
    expect(hasAtLeastOnePage(infiniteData, "referencesList")).toBe(false);
  });

  it("should return false if pages is empty", () => {
    const infiniteData = { pages: [], pageParams: [""] };
    expect(hasAtLeastOnePage(infiniteData, "referencesList")).toBe(false);
  });

  it("should return false if the first page's list is empty", () => {
    const infiniteData = {
      pages: [{ referencesList: [], nextPageToken: "" }],
      pageParams: [""],
    };
    expect(hasAtLeastOnePage(infiniteData, "referencesList")).toBe(false);
  });

  it("should return true if there is at least one page of data", () => {
    const infiniteData = {
      pages: [{ referencesList: [{ referenceId: 1 }], nextPageToken: "" }],
      pageParams: [""],
    };
    expect(hasAtLeastOnePage(infiniteData, "referencesList")).toBe(true);
  });
});
