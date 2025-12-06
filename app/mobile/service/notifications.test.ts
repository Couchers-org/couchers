import { registerMobilePushNotificationSubscription } from "./notifications";
import client from "./client";

jest.mock("./client", () => ({
  notifications: {
    registerMobilePushNotificationSubscription: jest.fn(),
  },
}));

const mockRegisterMobilePushNotificationSubscription = client.notifications
  .registerMobilePushNotificationSubscription as jest.Mock;

describe("registerMobilePushNotificationSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers a push notification subscription with all fields", async () => {
    mockRegisterMobilePushNotificationSubscription.mockResolvedValue({});

    await registerMobilePushNotificationSubscription({
      token: "expo-push-token-123",
      deviceName: "iPhone 15",
      deviceType: "ios",
    });

    expect(
      mockRegisterMobilePushNotificationSubscription,
    ).toHaveBeenCalledTimes(1);

    const req = mockRegisterMobilePushNotificationSubscription.mock.calls[0][0];
    expect(req.getToken()).toBe("expo-push-token-123");
    expect(req.getDeviceName()).toBe("iPhone 15");
    expect(req.getDeviceType()).toBe("ios");
  });

  it("registers with only required token field", async () => {
    mockRegisterMobilePushNotificationSubscription.mockResolvedValue({});

    await registerMobilePushNotificationSubscription({
      token: "expo-push-token-456",
    });

    expect(
      mockRegisterMobilePushNotificationSubscription,
    ).toHaveBeenCalledTimes(1);

    const req = mockRegisterMobilePushNotificationSubscription.mock.calls[0][0];
    expect(req.getToken()).toBe("expo-push-token-456");
    expect(req.getDeviceName()).toBe("");
    expect(req.getDeviceType()).toBe("");
  });

  it("registers with token and deviceName only", async () => {
    mockRegisterMobilePushNotificationSubscription.mockResolvedValue({});

    await registerMobilePushNotificationSubscription({
      token: "expo-push-token-789",
      deviceName: "Pixel 8",
    });

    expect(
      mockRegisterMobilePushNotificationSubscription,
    ).toHaveBeenCalledTimes(1);

    const req = mockRegisterMobilePushNotificationSubscription.mock.calls[0][0];
    expect(req.getToken()).toBe("expo-push-token-789");
    expect(req.getDeviceName()).toBe("Pixel 8");
    expect(req.getDeviceType()).toBe("");
  });

  it("propagates errors from the client", async () => {
    const error = new Error("Network error");
    mockRegisterMobilePushNotificationSubscription.mockRejectedValue(error);

    await expect(
      registerMobilePushNotificationSubscription({
        token: "expo-push-token-error",
      }),
    ).rejects.toThrow("Network error");
  });
});
