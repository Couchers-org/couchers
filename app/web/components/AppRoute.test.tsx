import { render, screen, waitFor } from "@testing-library/react";
import useAuthStore from "features/auth/useAuthStore";
import React from "react";
import wrapper from "test/hookWrapper";

import { appGetLayout } from "./AppRoute";

jest.mock("features/auth/useAuthStore");
jest.mock("components/Navigation", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("components/Footer", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("components/CookieBanner", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("features/notifications/PushNotificationBanner", () => ({
  PushNotificationBanner: () => (
    <div role="status" aria-label="Push notification banner">
      Push notification banner
    </div>
  ),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe("AppRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the push notification banner when the user is authenticated", async () => {
    mockUseAuthStore.mockReturnValue({
      authState: {
        authenticated: true,
        error: null,
        jailed: false,
        loading: false,
        userId: 1,
        flowState: null,
      },
      authActions: {
        authError: jest.fn(),
        clearError: jest.fn(),
        firstLogin: jest.fn(),
        logout: jest.fn(),
        passwordLogin: jest.fn(),
        updateJailStatus: jest.fn(),
        updateSignupState: jest.fn(),
      },
    });

    render(appGetLayout({ isPrivate: false })(<div>content</div>), { wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText("Push notification banner")).toBeInTheDocument();
    });
  });

  it("does not render the push notification banner when the user is not authenticated", () => {
    mockUseAuthStore.mockReturnValue({
      authState: {
        authenticated: false,
        error: null,
        jailed: false,
        loading: false,
        userId: null,
        flowState: null,
      },
      authActions: {
        authError: jest.fn(),
        clearError: jest.fn(),
        firstLogin: jest.fn(),
        logout: jest.fn(),
        passwordLogin: jest.fn(),
        updateJailStatus: jest.fn(),
        updateSignupState: jest.fn(),
      },
    });

    render(appGetLayout({ isPrivate: false })(<div>content</div>), { wrapper });

    expect(screen.queryByLabelText("Push notification banner")).not.toBeInTheDocument();
  });
});
