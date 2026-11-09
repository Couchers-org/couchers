import { Platform } from "react-native";

import { shouldLimitToAppBoundDomains } from "@/utils/appBoundDomains";

jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: { appBoundDomains: ["couchers.org", "api.couchers.org"] },
  },
}));

describe("shouldLimitToAppBoundDomains", () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    Platform.OS = originalOS;
  });

  describe("on iOS", () => {
    beforeEach(() => {
      Platform.OS = "ios";
    });

    it("limits web views on an app-bound domain", () => {
      expect(shouldLimitToAppBoundDomains("https://couchers.org")).toBe(true);
      expect(shouldLimitToAppBoundDomains("https://Couchers.org/en")).toBe(
        true,
      );
    });

    it("doesn't limit web views on other domains, which would block them", () => {
      expect(shouldLimitToAppBoundDomains("https://my-branch.vercel.app")).toBe(
        false,
      );
      expect(shouldLimitToAppBoundDomains("http://192.168.1.10:3000")).toBe(
        false,
      );
      expect(shouldLimitToAppBoundDomains("https://evil-couchers.org")).toBe(
        false,
      );
    });
  });

  it("never limits web views on Android", () => {
    Platform.OS = "android";

    expect(shouldLimitToAppBoundDomains("https://couchers.org")).toBe(false);
  });
});
