import BiDirectionalMap from "./BidirectionalMap";

const map = new BiDirectionalMap([
  [1, "hi"],
  [2, "bye"],
]);

describe("BidirectionalMap", () => {
  it("gets key", () => {
    expect(map.get(1)).toEqual("hi");
  });

  it("gets value", () => {
    expect(map.getKey("bye")).toEqual(2);
  });
});
