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
  useLastNotificationResponse: jest.fn(() => null),
  DEFAULT_ACTION_IDENTIFIER: "expo.modules.notifications.actions.DEFAULT",
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
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const { authenticated, checkedAuthStatus } = useAuthContext();
  useRegisterPushNotifications();

  useEffect(() => {
    // Wait until navigation structure is ready
    if (!authenticated || !checkedAuthStatus) return;

    if (
      lastNotificationResponse &&
      lastNotificationResponse.actionIdentifier ===
        Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      const url = lastNotificationResponse.notification.request.content.data
        ?.url as string | undefined;
      const path = getNotificationPath(url);
      if (path) {
        router.push(path as Href);
      }
    }
  }, [lastNotificationResponse, authenticated, checkedAuthStatus, router]);

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

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useRegisterPushNotifications as jest.Mock).mockReturnValue(undefined);
    // Default: authenticated and ready
    (useAuthContext as jest.Mock).mockReturnValue({
      authenticated: true,
      checkedAuthStatus: true,
    });
  });

  it("registers push notifications on mount", () => {
    render(<TestPushNotificationsRegistrar />);

    expect(useRegisterPushNotifications).toHaveBeenCalled();
  });

  it("navigates to path from notification URL when authenticated", () => {
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue({
      actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      notification: {
        request: {
          content: {
            data: { url: "https://couchers.org/messages/requests/123" },
          },
        },
      },
    });

    render(<TestPushNotificationsRegistrar />);

    // Paths are extracted from URL and pushed directly
    expect(mockRouter.push).toHaveBeenCalledWith("/messages/requests/123");
  });

  it("navigates to base path directly", () => {
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue({
      actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      notification: {
        request: {
          content: { data: { url: "https://couchers.org/messages" } },
        },
      },
    });

    render(<TestPushNotificationsRegistrar />);

    expect(mockRouter.push).toHaveBeenCalledWith("/messages");
  });

  it("handles notification with path-only URL as fallback", () => {
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue({
      actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      notification: {
        request: { content: { data: { url: "/messages/456" } } },
      },
    });

    render(<TestPushNotificationsRegistrar />);

    // Path-only URLs that fail URL parsing use fallback (push as-is)
    expect(mockRouter.push).toHaveBeenCalledWith("/messages/456");
  });

  it("navigates to leave-reference paths correctly", () => {
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue({
      actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      notification: {
        request: {
          content: {
            data: { url: "https://couchers.org/leave-reference/surfed/91/320" },
          },
        },
      },
    });

    render(<TestPushNotificationsRegistrar />);

    expect(mockRouter.push).toHaveBeenCalledWith(
      "/leave-reference/surfed/91/320",
    );
  });

  it("ignores notifications without URL", () => {
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue({
      actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      notification: { request: { content: { data: {} } } },
    });

    render(<TestPushNotificationsRegistrar />);

    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("does not navigate when not authenticated", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      authenticated: false,
      checkedAuthStatus: true,
    });
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue({
      actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      notification: {
        request: {
          content: {
            data: { url: "https://couchers.org/leave-reference/surfed/91/320" },
          },
        },
      },
    });

    render(<TestPushNotificationsRegistrar />);

    // Should NOT navigate because user is not authenticated
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("does not navigate while auth status is being checked", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      authenticated: false,
      checkedAuthStatus: false,
    });
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue({
      actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      notification: {
        request: {
          content: {
            data: { url: "https://couchers.org/leave-reference/surfed/91/320" },
          },
        },
      },
    });

    render(<TestPushNotificationsRegistrar />);

    // Should NOT navigate because auth status hasn't been checked yet
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("ignores non-default action notifications", () => {
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue({
      actionIdentifier: "some.other.action",
      notification: {
        request: {
          content: {
            data: { url: "https://couchers.org/messages/123" },
          },
        },
      },
    });

    render(<TestPushNotificationsRegistrar />);

    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
