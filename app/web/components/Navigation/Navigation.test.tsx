import { render, screen, waitFor } from "@testing-library/react";
import useAuthStore from "features/auth/useAuthStore";
import React from "react";
import wrapper from "test/hookWrapper";
import { createMatchMedia } from "test/utils";

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

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

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
