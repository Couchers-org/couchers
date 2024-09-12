import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PushNotificationPermission from "features/auth/notifications/PushNotificationPermission";
import { useTranslation } from "i18n";
import {
  getVapidPublicKey,
  registerPushNotificationSubscription,
} from "service/notifications";

jest.mock("i18n", () => ({
  useTranslation: jest.fn(),
}));

jest.mock("service/notifications", () => ({
  getVapidPublicKey: jest.fn(),
  registerPushNotificationSubscription: jest.fn(),
}));

// Mock Service Worker API
const mockServiceWorker = {
  register: jest.fn(),
  pushManager: {
    getSubscription: jest.fn(),
    subscribe: jest.fn(),
  },
};

describe("PushNotificationPermission Component", () => {
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
    const mockDefault = {
      requestPermission: jest.fn().mockImplementation(() => {
        return "default";
      }),
      permission: "default",
    };

    Object.assign(global.Notification, mockDefault);

    jest.resetAllMocks();
  });

  it("Renders push notifications settings", () => {
    render(<PushNotificationPermission className="test-class" />);
    expect(
      screen.getByText("notification_settings.push_notifications.title")
    ).toBeInTheDocument();
  });

  it("Displays enabled message when permission is granted", async () => {
    const mockGranted = {
      requestPermission: jest.fn().mockImplementation(() => {
        return "granted";
      }),
      permission: "granted",
    };

    Object.assign(global.Notification, mockGranted);

    render(<PushNotificationPermission className="test-class" />);

    await waitFor(() => {
      expect(screen.getByText("enabled")).toBeInTheDocument();
    });
  });

  it("Displays disabled message when permission is NOT granted", async () => {
    const mockDefault = {
      requestPermission: jest.fn().mockImplementation(() => {
        return "default";
      }),
      permission: "default",
    };

    Object.assign(global.Notification, mockDefault);
    render(<PushNotificationPermission className="test-class" />);

    Object.defineProperty(Notification, "permission", {
      value: "default",
      writable: true,
    });

    await waitFor(() => {
      expect(screen.getByText("disabled")).toBeInTheDocument();
    });
  });

  it("Displays error message when push notifications are not supported", async () => {
    const mockChangeDefaultToGranted = {
      requestPermission: jest.fn().mockImplementation(() => {
        return "granted";
      }),
      permission: "default",
    };

    Object.assign(global.Notification, mockChangeDefaultToGranted);

    render(<PushNotificationPermission className="test-class" />);

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

    render(<PushNotificationPermission className="test-class" />);
    fireEvent.click(document.querySelector("input[type='checkbox']")!);

    await waitFor(() => {
      expect(
        screen.getByText(
          "notification_settings.push_notifications.error_blocked_push"
        )
      ).toBeInTheDocument();
    });
  });

  it("Unsubscribes when permission is revoked", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: mockServiceWorker,
    });

    Object.defineProperty(window, "PushManager", {});

    const mockGranted = {
      requestPermission: jest.fn().mockImplementation(() => {
        return "granted";
      }),
      permission: "granted",
    };

    Object.assign(global.Notification, mockGranted);
    const mockUnsubscribe = jest.fn();

    // Mock existing push subscription
    mockServiceWorker.register.mockResolvedValue({
      pushManager: {
        getSubscription: jest.fn().mockResolvedValue({
          unsubscribe: mockUnsubscribe,
        }),
      },
    });

    render(<PushNotificationPermission className="test-class" />);

    fireEvent.click(document.querySelector("input[type='checkbox']")!);

    await waitFor(() => {
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  it("Subscribes to push notifications when permission is granted", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: mockServiceWorker,
    });

    Object.defineProperty(window, "PushManager", {});

    const mockChangeDefaultToGranted = {
      requestPermission: jest.fn().mockImplementation(() => {
        return "granted";
      }),
      permission: "default",
    };

    Object.assign(global.Notification, mockChangeDefaultToGranted);

    const mockSubscribe = jest.fn();
    const mockGetVapidPublicKey = getVapidPublicKey as jest.Mock;

    mockServiceWorker.register.mockResolvedValue({
      pushManager: {
        getSubscription: jest.fn().mockResolvedValue(null),
        subscribe: mockSubscribe,
      },
    });

    mockGetVapidPublicKey.mockResolvedValue({
      vapidPublicKey: new Uint8Array(8),
    });

    render(<PushNotificationPermission className="test-class" />);

    fireEvent.click(document.querySelector("input[type='checkbox']")!);

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
      expect(registerPushNotificationSubscription).toHaveBeenCalled();
    });
  });
});
