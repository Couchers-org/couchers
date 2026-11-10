import { render, screen, userEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import OfflineBanner from "@/components/OfflineBanner";
import { useNetworkStatus } from "@/features/network/NetworkStatusContext";

jest.mock("@/features/network/NetworkStatusContext", () => ({
  useNetworkStatus: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => ({
  ...jest.requireActual("react-native-safe-area-context"),
  useSafeAreaInsets: jest.fn(),
}));

const insets = { top: 44, bottom: 34, left: 0, right: 0 };

function TopInset() {
  return (
    <SafeAreaInsetsContext.Consumer>
      {(value) => <Text>{`top inset: ${value?.top}`}</Text>}
    </SafeAreaInsetsContext.Consumer>
  );
}

describe("OfflineBanner", () => {
  const recheck = jest.fn(() => Promise.resolve());
  const user = userEvent.setup();

  beforeEach(() => {
    (useSafeAreaInsets as jest.Mock).mockReturnValue(insets);
  });

  it("shows nothing extra when online", () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({
      isOffline: false,
      recheck,
    });

    render(
      <OfflineBanner>
        <TopInset />
      </OfflineBanner>,
    );

    expect(screen.queryByText("errors.no_connection")).not.toBeOnTheScreen();
    expect(screen.getByText("top inset: 44")).toBeOnTheScreen();
  });

  it("shows the banner above the screens when offline", () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({
      isOffline: true,
      recheck,
    });

    render(
      <OfflineBanner>
        <TopInset />
      </OfflineBanner>,
    );

    expect(screen.getByText("errors.no_connection")).toBeOnTheScreen();
    // The banner takes up the top safe area instead of the screens
    expect(screen.getByText("top inset: 0")).toBeOnTheScreen();
  });

  it("checks the connection again when tapped", async () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({
      isOffline: true,
      recheck,
    });

    render(
      <OfflineBanner>
        <TopInset />
      </OfflineBanner>,
    );

    await user.press(
      screen.getByRole("button", { name: "errors.no_connection" }),
    );

    expect(recheck).toHaveBeenCalled();
  });
});
