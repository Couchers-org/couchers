import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { Platform } from "react-native";

import { takeInstallReferrer } from "@/utils/installReferrer";

jest.mock("expo-application", () => ({
  getInstallReferrerAsync: jest.fn(),
}));

const getInstallReferrerAsync =
  Application.getInstallReferrerAsync as jest.Mock;

describe("takeInstallReferrer", () => {
  const originalPlatformOS = Platform.OS;

  beforeEach(async () => {
    await AsyncStorage.clear();
    Platform.OS = "android";
  });

  afterEach(() => {
    Platform.OS = originalPlatformOS;
  });

  it("returns the referrer on the first call only", async () => {
    getInstallReferrerAsync.mockResolvedValue("ht=abc&utm_source=x");

    expect(await takeInstallReferrer()).toBe("ht=abc&utm_source=x");
    expect(await takeInstallReferrer()).toBeNull();
    expect(getInstallReferrerAsync).toHaveBeenCalledTimes(1);
  });

  it("returns null when the referrer can't be read", async () => {
    getInstallReferrerAsync.mockRejectedValue(new Error("no play services"));

    expect(await takeInstallReferrer()).toBeNull();
  });

  it("gives up when the referrer never arrives", async () => {
    getInstallReferrerAsync.mockReturnValue(new Promise(() => {}));

    const result = takeInstallReferrer();
    await jest.advanceTimersByTimeAsync(2000);

    expect(await result).toBeNull();
  });

  it("does nothing on iOS", async () => {
    Platform.OS = "ios";

    expect(await takeInstallReferrer()).toBeNull();
    expect(getInstallReferrerAsync).not.toHaveBeenCalled();
  });
});
