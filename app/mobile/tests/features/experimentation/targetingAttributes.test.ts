import { getTargetingAttributes } from "@/features/experimentation/targetingAttributes";

describe("getTargetingAttributes", () => {
  it("is empty when logged out", () => {
    expect(
      getTargetingAttributes(null, '{"id": "1", "is_volunteer": true}'),
    ).toEqual({});
  });

  it("uses the attributes from account info", () => {
    expect(
      getTargetingAttributes(1, '{"id": "1", "is_volunteer": true}'),
    ).toEqual({ id: "1", is_volunteer: true });
  });

  it("falls back to just the id before account info has loaded", () => {
    expect(getTargetingAttributes(1, undefined)).toEqual({ id: "1" });
    expect(getTargetingAttributes(1, "")).toEqual({ id: "1" });
  });

  it("ignores attributes belonging to a different user", () => {
    expect(
      getTargetingAttributes(2, '{"id": "1", "is_volunteer": true}'),
    ).toEqual({ id: "2" });
  });
});
