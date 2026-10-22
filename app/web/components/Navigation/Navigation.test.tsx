import { render, screen, waitFor } from "@testing-library/react";
import useAuthStore from "features/auth/useAuthStore";
import React from "react";
import wrapper from "test/hookWrapper";
import { createMatchMedia } from "test/utils";
import { useIsNativeEmbed } from "utils/nativeLink";

import Navigation from "./Navigation";

jest.mock("features/auth/useAuthStore");
jest.mock("features/translate/LanguagePickerSelect", () => ({
  __esModule: true,
  default: () => <div data-testid="language-picker" />,
}));

jest.mock("features/donations/DonationBanner", () => ({
  DonationBanner: () => (
    <div role="status" aria-label="Donation banner">
      Donation banner
    </div>
  ),
}));

jest.mock("utils/nativeLink", () => ({
  useIsNativeEmbed: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe("Navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the donation banner when the user is authenticated", async () => {
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

    render(<Navigation />, { wrapper });

    // Wait for component to mount and banners to appear
    await waitFor(() => {
      expect(screen.getByLabelText("Donation banner")).toBeInTheDocument();
    });
  });

  it("does not render the donation banner when the user is not authenticated", () => {
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

    render(<Navigation />, { wrapper });

    expect(screen.queryByLabelText("Donation banner")).not.toBeInTheDocument();
  });
});

it("renders the language picker on mobile when the user is logged out", () => {
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = createMatchMedia(800);

  try {
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

    render(<Navigation />, { wrapper });

    expect(screen.getByTestId("language-picker")).toBeInTheDocument();
  } finally {
    window.matchMedia = originalMatchMedia;
  }
});

describe("BottomNavigation integration", () => {
  const authenticatedAuthState = () => ({
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

  const unauthenticatedAuthState = () => ({
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

  beforeEach(() => {
    jest.clearAllMocks();
    (useIsNativeEmbed as jest.Mock).mockReturnValue(false);
  });

  it("renders on mobile web when authenticated and not in native embed", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = createMatchMedia(400);

    try {
      mockUseAuthStore.mockReturnValue(authenticatedAuthState());
      (useIsNativeEmbed as jest.Mock).mockReturnValue(false);

      render(<Navigation />, { wrapper });

      expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Messages" })).toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("is hidden on mobile web when not authenticated", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = createMatchMedia(400);

    try {
      mockUseAuthStore.mockReturnValue(unauthenticatedAuthState());
      (useIsNativeEmbed as jest.Mock).mockReturnValue(false);

      render(<Navigation />, { wrapper });

      expect(screen.queryByRole("button", { name: "Home" })).not.toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("is hidden in native embed even when authenticated", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = createMatchMedia(400);

    try {
      mockUseAuthStore.mockReturnValue(authenticatedAuthState());
      (useIsNativeEmbed as jest.Mock).mockReturnValue(true);

      render(<Navigation />, { wrapper });

      expect(screen.queryByRole("button", { name: "Home" })).not.toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("is hidden on desktop when not in native embed", () => {
    mockUseAuthStore.mockReturnValue(authenticatedAuthState());
    (useIsNativeEmbed as jest.Mock).mockReturnValue(false);

    render(<Navigation />, { wrapper });

    expect(screen.queryByRole("button", { name: "Home" })).not.toBeInTheDocument();
  });
});
