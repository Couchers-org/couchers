import { renderHook } from "@testing-library/react";
import { createMatchMedia } from "test/utils";
import { useIsNativeEmbed } from "utils/nativeLink";

import useOpensProfileSheet from "./useOpensProfileSheet";

jest.mock("utils/nativeLink", () => ({
  useIsNativeEmbed: jest.fn(),
}));

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

function renderWith(isNativeEmbed: boolean, width: number) {
  (useIsNativeEmbed as jest.Mock).mockReturnValue(isNativeEmbed);
  window.matchMedia = createMatchMedia(width);
  return renderHook(() => useOpensProfileSheet()).result.current;
}

describe("useOpensProfileSheet", () => {
  it("opens the sheet in the native app at tablet width", () => {
    expect(renderWith(true, 1180)).toBe(true);
  });

  it("opens the sheet in a narrow browser window", () => {
    expect(renderWith(false, 400)).toBe(true);
  });

  it("doesn't open the sheet on desktop web", () => {
    expect(renderWith(false, 1180)).toBe(false);
  });
});
