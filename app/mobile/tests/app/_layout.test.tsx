import { useGrowthBook } from "@growthbook/growthbook-react";
import { act, render, screen } from "@testing-library/react-native";
import * as SplashScreen from "expo-splash-screen";
import { ReactNode } from "react";

import RootLayout from "@/app/_layout";
import { useAuthContext } from "@/features/auth/AuthContext";
import { useNotificationObserver } from "@/features/notifications/useNotificationObserver";

// Side-effect imports at the top of the layout
jest.mock("react-native-reanimated", () => ({}));
jest.mock("@/i18n", () => ({}));
jest.mock("@/service/sentry", () => ({}));
jest.mock("@/service/updateExtraParams", () => ({}));

// Render the Stack as plain elements: a guarded group only shows its screens when
// its guard passes, and each screen shows its name.
jest.mock("expo-router", () => {
  const { Text: MockText } = jest.requireActual("react-native");
  const Stack = ({ children }: { children: ReactNode }) => children;
  Stack.Protected = ({
    guard,
    children,
  }: {
    guard: boolean;
    children: ReactNode;
  }) => (guard ? children : null);
  Stack.Screen = ({ name }: { name: string }) => (
    <MockText testID={`screen-${name}`}>{name}</MockText>
  );
  return { Stack };
});

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
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

jest.mock("@growthbook/growthbook-react", () => ({
  useGrowthBook: jest.fn(),
}));

jest.mock("@/features/auth/AuthContext", () => ({
  useAuthContext: jest.fn(),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("@/features/experimentation/FeatureFlagProvider", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("@/features/notifications/useNotificationObserver", () => ({
  useNotificationObserver: jest.fn(),
}));

jest.mock("@/features/notifications/useRegisterPushNotifications", () => ({
  useRegisterPushNotifications: jest.fn(),
}));

jest.mock("@/features/diagnostics/useNativeDiagnostics", () => ({
  useNativeDiagnostics: () => ({ prompt: null, dismiss: jest.fn() }),
}));

jest.mock("@/features/diagnostics/NativeUpdatePrompt", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/DevSettingsButton", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/config/urls", () => ({
  hydrateUrlOverrides: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/service/client", () => ({
  reconfigureApiClient: jest.fn(),
}));

// Keep the export unwrapped by Sentry
jest.mock("@/service/buildInfo", () => ({ appVariant: "development" }));

const useAuthContextMock = useAuthContext as jest.Mock;
const useGrowthBookMock = useGrowthBook as jest.Mock;

function setState({
  authenticated = true,
  checkedAuthStatus = true,
  featuresReady = true,
}) {
  useAuthContextMock.mockReturnValue({ authenticated, checkedAuthStatus });
  useGrowthBookMock.mockReturnValue({ ready: featuresReady });
}

// The root layout loads persisted config before rendering anything, so let that settle
async function renderRootLayout() {
  const result = render(<RootLayout />);
  await act(async () => {});
  return result;
}

describe("RootLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setState({});
  });

  it("keeps the splash screen up while auth is being checked", async () => {
    setState({ checkedAuthStatus: false });

    await renderRootLayout();

    expect(screen.queryByTestId("screen-(tabs)")).not.toBeOnTheScreen();
    expect(screen.queryByTestId("screen-login")).not.toBeOnTheScreen();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it("keeps the splash screen up while feature flags load", async () => {
    setState({ featuresReady: false });

    await renderRootLayout();

    expect(screen.queryByTestId("screen-(tabs)")).not.toBeOnTheScreen();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it("shows the app and hides the splash screen once logged in and ready", async () => {
    await renderRootLayout();

    expect(await screen.findByTestId("screen-(tabs)")).toBeOnTheScreen();
    expect(screen.queryByTestId("screen-login")).not.toBeOnTheScreen();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it("shows the logged-out screens when not logged in", async () => {
    setState({ authenticated: false });

    await renderRootLayout();

    expect(await screen.findByTestId("screen-login")).toBeOnTheScreen();
    expect(screen.getByTestId("screen-signup")).toBeOnTheScreen();
    expect(screen.queryByTestId("screen-(tabs)")).not.toBeOnTheScreen();
  });

  it("only starts handling notification taps once the app's screens are shown", async () => {
    // A tap that cold-starts the app can't navigate before the Stack exists,
    // so the observer must wait for everything the Stack waits for.
    setState({ featuresReady: false });
    const { rerender } = await renderRootLayout();
    expect(useNotificationObserver).not.toHaveBeenCalled();

    setState({ featuresReady: true });
    rerender(<RootLayout />);

    expect(await screen.findByTestId("screen-(tabs)")).toBeOnTheScreen();
    expect(useNotificationObserver).toHaveBeenCalled();
  });

  it("doesn't handle notification taps when logged out", async () => {
    setState({ authenticated: false });

    await renderRootLayout();

    expect(await screen.findByTestId("screen-login")).toBeOnTheScreen();
    expect(useNotificationObserver).not.toHaveBeenCalled();
  });
});
