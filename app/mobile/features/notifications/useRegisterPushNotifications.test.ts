import { renderHook, waitFor } from "@testing-library/react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { useAuthContext } from "@/features/auth/AuthContext";
import { registerMobilePushNotificationSubscription } from "@/service/notifications";

import { useRegisterPushNotifications } from "./useRegisterPushNotifications";

jest.mock("expo-device", () => ({
  isDevice: true,
  deviceName: "Test Device",
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  AndroidImportance: { MAX: 5 },
}));

jest.mock("expo-constants", () => ({
  expoConfig: { extra: { eas: { projectId: "test-project-id" } } },
}));

jest.mock("@/features/auth/AuthContext", () => ({
  useAuthContext: jest.fn(),
}));

jest.mock("@/service/notifications", () => ({
  registerMobilePushNotificationSubscription: jest.fn(),
}));

describe("useRegisterPushNotifications", () => {
  const mockToken = "ExponentPushToken[test-token-123]";
  const originalPlatformOS = Platform.OS;

  beforeEach(() => {
    Platform.OS = originalPlatformOS;
    (Device as { isDevice: boolean }).isDevice = true;
    (Constants as { expoConfig: unknown }).expoConfig = {
      extra: { eas: { projectId: "test-project-id" } },
    };

    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: mockToken,
    });
    (registerMobilePushNotificationSubscription as jest.Mock).mockResolvedValue(
      {},
    );
  });

  describe("when not authenticated", () => {
    it("does not register push notifications", async () => {
      (useAuthContext as jest.Mock).mockReturnValue({
        authenticated: false,
        userId: null,
      });

      renderHook(() => useRegisterPushNotifications());

      await waitFor(() => {
        expect(
          registerMobilePushNotificationSubscription,
        ).not.toHaveBeenCalled();
      });
    });
  });

  describe("when authenticated", () => {
    beforeEach(() => {
      (useAuthContext as jest.Mock).mockReturnValue({
        authenticated: true,
        userId: 123,
      });
    });

    it("registers push notification with token and device info", async () => {
      renderHook(() => useRegisterPushNotifications());

      await waitFor(() => {
        expect(registerMobilePushNotificationSubscription).toHaveBeenCalledWith(
          {
            token: mockToken,
            deviceName: "Test Device",
            deviceType: Platform.OS,
          },
        );
      });
    });

    it("requests permissions if not already granted", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "undetermined",
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "granted",
      });

      renderHook(() => useRegisterPushNotifications());

      await waitFor(() => {
        expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
        expect(registerMobilePushNotificationSubscription).toHaveBeenCalled();
      });
    });

    it("does not register if permissions denied", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "undetermined",
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: "denied",
      });

      renderHook(() => useRegisterPushNotifications());

      await waitFor(() => {
        expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      });

      expect(registerMobilePushNotificationSubscription).not.toHaveBeenCalled();
    });

    it("does not register on non-physical device", async () => {
      (Device as { isDevice: boolean }).isDevice = false;

      renderHook(() => useRegisterPushNotifications());

      await waitFor(() => {
        expect(
          registerMobilePushNotificationSubscription,
        ).not.toHaveBeenCalled();
      });
    });

    it("does not register if project ID is missing", async () => {
      (Constants as { expoConfig: unknown }).expoConfig = {};

      renderHook(() => useRegisterPushNotifications());

      await waitFor(() => {
        expect(
          registerMobilePushNotificationSubscription,
        ).not.toHaveBeenCalled();
      });
    });

    it("does not re-register same token", async () => {
      const { rerender } = renderHook(() => useRegisterPushNotifications());

      await waitFor(() => {
        expect(
          registerMobilePushNotificationSubscription,
        ).toHaveBeenCalledTimes(1);
      });

      rerender({});

      expect(registerMobilePushNotificationSubscription).toHaveBeenCalledTimes(
        1,
      );
    });

    it("re-registers when user changes", async () => {
      const { rerender } = renderHook(() => useRegisterPushNotifications());

      await waitFor(() => {
        expect(
          registerMobilePushNotificationSubscription,
        ).toHaveBeenCalledTimes(1);
      });

      const newToken = "ExponentPushToken[new-token-456]";
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: newToken,
      });
      (useAuthContext as jest.Mock).mockReturnValue({
        authenticated: true,
        userId: 456,
      });

      rerender({});

      await waitFor(() => {
        expect(registerMobilePushNotificationSubscription).toHaveBeenCalledWith(
          expect.objectContaining({ token: newToken }),
        );
      });
    });

    it("handles registration errors gracefully", async () => {
      (
        registerMobilePushNotificationSubscription as jest.Mock
      ).mockRejectedValue(new Error("Network error"));

      renderHook(() => useRegisterPushNotifications());

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Failed to register push notification subscription:",
          expect.any(Error),
        );
      });
    });
  });

  describe("Android channel configuration", () => {
    beforeEach(() => {
      (useAuthContext as jest.Mock).mockReturnValue({
        authenticated: true,
        userId: 123,
      });
    });

    it("configures notification channel on Android", async () => {
      Platform.OS = "android";

      renderHook(() => useRegisterPushNotifications());

      await waitFor(() => {
        expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
          "default",
          expect.objectContaining({
            name: "Default",
            importance: Notifications.AndroidImportance.MAX,
          }),
        );
      });
    });

    it("skips channel configuration on iOS", async () => {
      Platform.OS = "ios";

      renderHook(() => useRegisterPushNotifications());

      await waitFor(() => {
        expect(registerMobilePushNotificationSubscription).toHaveBeenCalled();
      });

      expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("cancels registration on unmount", async () => {
      (useAuthContext as jest.Mock).mockReturnValue({
        authenticated: true,
        userId: 123,
      });

      // Slow async operation that can be cancelled
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: mockToken }), 100),
          ),
      );

      const { unmount } = renderHook(() => useRegisterPushNotifications());

      unmount();

      jest.advanceTimersByTime(150);

      expect(registerMobilePushNotificationSubscription).not.toHaveBeenCalled();
    });
  });
});
