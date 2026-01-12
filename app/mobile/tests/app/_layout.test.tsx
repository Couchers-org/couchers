import { render, screen } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";
import { Href, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Text, View } from "react-native";

import { useAuthContext } from "@/features/auth/AuthContext";
import { useRegisterPushNotifications } from "@/features/notifications/useRegisterPushNotifications";
import { getNotificationPath } from "@/utils/getNotificationPath";

jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  useRouter: jest.fn(),
  Stack: {
    Screen: jest.fn(() => null),
  },
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  getLastNotificationResponse: jest.fn(() => null),
}));

jest.mock("@/features/auth/AuthContext", () => ({
  useAuthContext: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/features/notifications/useRegisterPushNotifications", () => ({
  useRegisterPushNotifications: jest.fn(),
}));

jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("@expo-google-fonts/ubuntu", () => ({
  useFonts: () => [true],
  Ubuntu_300Light: {},
  Ubuntu_300Light_Italic: {},
  Ubuntu_400Regular: {},
  Ubuntu_400Regular_Italic: {},
  Ubuntu_500Medium: {},
  Ubuntu_500Medium_Italic: {},
  Ubuntu_700Bold: {},
  Ubuntu_700Bold_Italic: {},
}));

// Test component mimicking RootNavigator auth-based routing
function TestRootNavigator() {
  const { authenticated, checkedAuthStatus } = useAuthContext();

  useEffect(() => {
    if (checkedAuthStatus) {
      SplashScreen.hideAsync();
    }
  }, [checkedAuthStatus]);

  if (!checkedAuthStatus) {
    return (
      <View testID="loading">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View testID="navigator">
      <View testID="login-screen">
        <Text testID="login-redirect">{String(authenticated)}</Text>
      </View>
      <View testID="tabs-screen">
        <Text testID="tabs-redirect">{String(!authenticated)}</Text>
      </View>
    </View>
  );
}

// Test component mimicking PushNotificationsRegistrar with useNotificationObserver
function TestPushNotificationsRegistrar() {
  const router = useRouter();
  useRegisterPushNotifications();

  useEffect(() => {
    function redirect(notification: {
      request: { content: { data?: { url?: string } } };
    }) {
      const path = getNotificationPath(notification.request.content.data?.url);
      if (path) {
        router.push(path as Href);
      }
    }

    // Check for cold start notification
    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse?.notification) {
      redirect(
        lastResponse.notification as {
          request: { content: { data?: { url?: string } } };
        },
      );
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response: {
        notification: { request: { content: { data?: { url?: string } } } };
      }) => {
        redirect(response.notification);
      },
    );

    return () => subscription.remove();
  }, [router]);

  return null;
}

describe("RootNavigator", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows loading state while checking auth status", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      authenticated: false,
      checkedAuthStatus: false,
    });

    render(<TestRootNavigator />);

    expect(screen.getByTestId("loading")).toBeOnTheScreen();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it("hides splash screen when auth status is checked", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      authenticated: false,
      checkedAuthStatus: true,
    });

    render(<TestRootNavigator />);

    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it("redirects login screen when authenticated", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      authenticated: true,
      checkedAuthStatus: true,
    });

    render(<TestRootNavigator />);

    expect(screen.getByTestId("login-redirect").props.children).toBe("true");
    expect(screen.getByTestId("tabs-redirect").props.children).toBe("false");
  });

  it("redirects tabs screen when not authenticated", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      authenticated: false,
      checkedAuthStatus: true,
    });

    render(<TestRootNavigator />);

    expect(screen.getByTestId("login-redirect").props.children).toBe("false");
    expect(screen.getByTestId("tabs-redirect").props.children).toBe("true");
  });
});

describe("PushNotificationsRegistrar", () => {
  const mockRouter = { push: jest.fn() };
  let notificationCallback: (response: {
    notification: { request: { content: { data?: { url?: string } } } };
  }) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useRegisterPushNotifications as jest.Mock).mockReturnValue(undefined);

    (
      Notifications.addNotificationResponseReceivedListener as jest.Mock
    ).mockImplementation((callback) => {
      notificationCallback = callback;
      return { remove: jest.fn() };
    });
  });

  it("registers push notifications on mount", () => {
    render(<TestPushNotificationsRegistrar />);

    expect(useRegisterPushNotifications).toHaveBeenCalled();
    expect(
      Notifications.addNotificationResponseReceivedListener,
    ).toHaveBeenCalled();
  });

  it("navigates to path from notification URL", () => {
    render(<TestPushNotificationsRegistrar />);

    notificationCallback({
      notification: {
        request: {
          content: {
            data: { url: "https://couchers.org/messages/requests/123" },
          },
        },
      },
    });

    // Paths are extracted from URL and pushed directly
    expect(mockRouter.push).toHaveBeenCalledWith("/messages/requests/123");
  });

  it("navigates to base path directly", () => {
    render(<TestPushNotificationsRegistrar />);

    notificationCallback({
      notification: {
        request: {
          content: { data: { url: "https://couchers.org/messages" } },
        },
      },
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/messages");
  });

  it("handles notification with path-only URL as fallback", () => {
    render(<TestPushNotificationsRegistrar />);

    notificationCallback({
      notification: {
        request: { content: { data: { url: "/messages/456" } } },
      },
    });

    // Path-only URLs that fail URL parsing use fallback (push as-is)
    expect(mockRouter.push).toHaveBeenCalledWith("/messages/456");
  });

  it("navigates to leave-reference paths correctly", () => {
    render(<TestPushNotificationsRegistrar />);

    notificationCallback({
      notification: {
        request: {
          content: {
            data: { url: "https://couchers.org/leave-reference/surfed/91/320" },
          },
        },
      },
    });

    expect(mockRouter.push).toHaveBeenCalledWith(
      "/leave-reference/surfed/91/320",
    );
  });

  it("ignores notifications without URL", () => {
    render(<TestPushNotificationsRegistrar />);

    notificationCallback({
      notification: { request: { content: { data: {} } } },
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("cleans up listener on unmount", () => {
    const mockRemove = jest.fn();
    (
      Notifications.addNotificationResponseReceivedListener as jest.Mock
    ).mockReturnValue({ remove: mockRemove });

    const { unmount } = render(<TestPushNotificationsRegistrar />);
    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });
});
