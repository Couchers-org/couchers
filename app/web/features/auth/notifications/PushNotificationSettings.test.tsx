import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useTranslation } from "i18n";
import { ReactChildren } from "react";
import {
  getVapidPublicKey,
  registerPushNotificationSubscription,
} from "service/notifications";
import wrapper from "test/hookWrapper";

import PushNotificationSettings from "./PushNotificationSettings";

jest.mock("platform/sentry", () => ({
  captureException: jest.fn(),
}));

jest.mock("i18n", () => ({
  useTranslation: jest.fn(),
  Trans: ({ children }: { children: ReactChildren }) => children, // Mock the Trans component to return its children
}));

jest.mock("service/notifications", () => ({
  getVapidPublicKey: jest.fn(),
  registerPushNotificationSubscription: jest.fn(() => Promise.resolve()),
}));

// Mock Service Worker API
const mockServiceWorker = {
  register: jest.fn(),
  pushManager: {
    getSubscription: jest.fn(),
    subscribe: jest.fn(),
  },
  getRegistration: jest.fn(),
};

describe("PushNotificationSettings Component", () => {
  const originalNavigator = global.navigator;
  const originalWindow = global.window;

  const mNotification = jest.fn();
  Object.defineProperty(global, "Notification", {
    value: mNotification,
  });

  beforeEach(() => {
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => key,
    });
  });

  afterEach(() => {
    // Restore the original navigator and window objects after each test
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      configurable: true,
    });
    Object.defineProperty(global, "window", {
      value: originalWindow,
      configurable: true,
    });

    jest.resetAllMocks();
  });

  it("Renders push notifications settings", () => {
    render(<PushNotificationSettings className="test-class" />, { wrapper });
    expect(
      screen.getByText("notification_settings.push_notifications.title")
    ).toBeInTheDocument();
  });

  it("Displays enabled message when permission is granted", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: mockServiceWorker,
    });

    Object.defineProperty(window, "PushManager", {});

    mockServiceWorker.getRegistration.mockResolvedValue(null);

    const mockGranted = {
      requestPermission: jest.fn().mockImplementation(() => {
        return "granted";
      }),
      permission: "granted",
    };

    Object.assign(global.Notification, mockGranted);

    render(<PushNotificationSettings className="test-class" />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("enabled")).toBeInTheDocument();
    });
  });

  it("Displays disabled message when permission is NOT granted", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: mockServiceWorker,
    });

    const mockDefault = {
      requestPermission: jest.fn().mockImplementation(() => {
        return "default";
      }),
      permission: "default",
    };

    Object.assign(global.Notification, mockDefault);
    render(<PushNotificationSettings className="test-class" />, { wrapper });

    Object.defineProperty(Notification, "permission", {
      value: "default",
      writable: true,
    });

    await waitFor(() => {
      expect(screen.getByText("disabled")).toBeInTheDocument();
    });
  });

  it.skip("Displays error message when push notifications are not supported", async () => {
    // TOD: Need to somehow mock no navigator.PushManager or window.PushManager key
    const mockChangeDefaultToGranted = {
      requestPermission: jest.fn().mockImplementation(() => {
        return "granted";
      }),
      permission: "default",
    };

    Object.assign(global.Notification, mockChangeDefaultToGranted);

    render(<PushNotificationSettings className="test-class" />, { wrapper });

    fireEvent.click(document.querySelector("input[type='checkbox']")!);

    await waitFor(() => {
      expect(
        screen.getByText(
          "notification_settings.push_notifications.error_unsupported"
        )
      ).toBeInTheDocument();
    });
  });

  it("Displays error when permission is denied", async () => {
    const mockDenied = {
      requestPermission: jest.fn().mockImplementation(() => {
        return "denied";
      }),
      permission: "denied",
    };

    Object.assign(global.Notification, mockDenied);

    render(<PushNotificationSettings className="test-class" />, { wrapper });
    fireEvent.click(document.querySelector("input[type='checkbox']")!);

    await waitFor(() => {
      expect(
        screen.getByText(
          "notification_settings.push_notifications.permission_denied.instructions.generic"
        )
      ).toBeInTheDocument();
    });
  });

  it("Unsubscribes when permission is revoked", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: mockServiceWorker,
    });

    const mockGranted = {
      requestPermission: jest.fn().mockImplementation(() => {
        return "granted";
      }),
      permission: "granted",
    };

    Object.assign(global.Notification, mockGranted);
    const mockUnsubscribe = jest.fn();

    (getVapidPublicKey as jest.Mock).mockResolvedValue({
      vapidPublicKey: "mockedVapidPublicKey",
    });

    // Mock existing push subscription
    mockServiceWorker.getRegistration.mockResolvedValue({
      pushManager: {
        subscribe: jest.fn(),
        getSubscription: jest.fn().mockResolvedValue({
          getKey: jest.fn().mockReturnValue("mockedVapidPublicKey"),
          unsubscribe: mockUnsubscribe,
        }),
      },
    });

    render(<PushNotificationSettings className="test-class" />, { wrapper });

    fireEvent.click(document.querySelector("input[type='checkbox']")!);

    await waitFor(() => {
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  it("Subscribes to push notifications when permission is granted", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: mockServiceWorker,
    });

    const mockChangeDefaultToGranted = {
      requestPermission: jest.fn().mockImplementation(() => {
        return "granted";
      }),
      permission: "default",
    };

    Object.assign(global.Notification, mockChangeDefaultToGranted);

    const mockSubscribe = jest.fn();

    (getVapidPublicKey as jest.Mock).mockResolvedValue({
      vapidPublicKey: "mockedVapidPublicKey",
    });
    mockServiceWorker.getRegistration.mockResolvedValue({
      pushManager: {
        getSubscription: jest.fn().mockResolvedValue(null),
        subscribe: mockSubscribe,
      },
    });

    render(<PushNotificationSettings className="test-class" />, { wrapper });

    fireEvent.click(document.querySelector("input[type='checkbox']")!);

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
      expect(registerPushNotificationSubscription).toHaveBeenCalled();
    });
  });
});
