import type { ReactNode } from "react";

import { currentActiveWebPathRef } from "@/state/webViewState";

type Decision = {
  shouldShowBanner: boolean;
  shouldShowList: boolean;
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
};

const mockForegroundHandler: {
  current?: (notification: unknown) => Promise<Decision>;
} = {};

jest.mock("native-build-info", () => ({
  embeddedDisplayVersion: "v1.0.0-test",
  embeddedDebugVersion: "v1.0.0-test",
}));

jest.mock("@/features/auth/AuthContext", () => ({
  useAuthContext: jest.fn(),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("@/service/client", () => ({
  reconfigureApiClient: jest.fn(),
}));

jest.mock("@/service/sentry", () => ({}));

jest.mock("@/service/updateExtraParams", () => ({}));

jest.mock("@/features/notifications/useRegisterPushNotifications", () => ({
  useRegisterPushNotifications: jest.fn(),
}));

jest.mock("@/features/diagnostics/useNativeDiagnostics", () => ({
  useNativeDiagnostics: () => ({ prompt: null, dismiss: jest.fn() }),
}));

jest.mock("@/features/diagnostics/NativeUpdatePrompt", () => () => null);

jest.mock("@/features/experimentation/FeatureFlagProvider", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("@/components/DevSettingsButton", () => () => null);

jest.mock("@/components/WebEmbed", () => () => null);

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: (options: {
    handleNotification: (notification: unknown) => Promise<Decision>;
  }) => {
    mockForegroundHandler.current = options.handleNotification;
  },
  setNotificationChannelAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  getLastNotificationResponse: jest.fn(() => null),
  useLastNotificationResponse: jest.fn(() => null),
  AndroidImportance: { MAX: 5 },
  DEFAULT_ACTION_IDENTIFIER: "expo.modules.notifications.actions.DEFAULT",
}));

function loadNotificationModules() {
  // require so registration happens after mockForegroundHandler exists
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@/app/_layout");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@/app/(tabs)/dashboard");
}

function messageNotification(url: string) {
  return {
    request: {
      content: {
        data: { url },
      },
    },
  };
}

describe("foreground notification handler", () => {
  beforeAll(() => {
    loadNotificationModules();
  });

  afterEach(() => {
    currentActiveWebPathRef.current = null;
  });

  it("hides the banner for the open chat and shows it for a different chat", async () => {
    const handleNotification = mockForegroundHandler.current;
    if (!handleNotification) {
      throw new Error("no foreground notification handler registered");
    }

    const messageUrl = "https://couchers.org/messages/42";

    currentActiveWebPathRef.current = "/messages/42";
    await expect(
      handleNotification(messageNotification(messageUrl)),
    ).resolves.toEqual({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    });

    currentActiveWebPathRef.current = "/dashboard";
    await expect(
      handleNotification(messageNotification(messageUrl)),
    ).resolves.toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    });
  });
});
