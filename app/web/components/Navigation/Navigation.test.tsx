import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import wrapper from "test/hookWrapper";

import Navigation from "./Navigation";

jest.mock("features/auth/useAuthStore", () => ({
  __esModule: true,
  default: () => ({
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
  }),
}));

jest.mock("next/router", () => ({
  __esModule: true,
  useRouter: () => ({
    push: jest.fn(),
    pathname: "/",
    asPath: "/",
  }),
  default: {
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
  },
}));

const mockUseAccountInfo = jest.fn();
jest.mock("features/auth/useAccountInfo", () => ({
  __esModule: true,
  default: () => mockUseAccountInfo(),
}));

jest.mock("features/donations/DonationBanner", () => ({
  DonationBanner: () => (
    <div role="status" aria-label="Donation banner">
      Donation banner
    </div>
  ),
}));

jest.mock("features/notifications/PushNotificationBanner", () => ({
  PushNotificationBanner: () => <div data-testid="push-notification-banner" />,
}));

const baseAccountInfo = {
  username: "testuser",
  email: "test@couchers.org",
  profileComplete: true,
  phone: "+46701740605",
  phoneVerified: true,
  timezone: "Australia/Melbourne",
  hasStrongVerification: false,
  birthdateVerificationStatus: 1,
  genderVerificationStatus: 3,
  doNotEmail: false,
  hasDonated: false,
  uiLanguagePreference: "",
  profilePublicVisibility: 1,
  isVolunteer: false,
  myHomeComplete: false,
  shouldShowDonationBanner: false,
  isSuperuser: false,
};

describe("Navigation - DonationBanner", () => {
  it("shows the donation banner when shouldShowDonationBanner is true", async () => {
    mockUseAccountInfo.mockReturnValue({
      data: {
        ...baseAccountInfo,
        shouldShowDonationBanner: true,
      },
      isLoading: false,
    });

    render(<Navigation />, { wrapper });

    expect(await screen.findByLabelText("Donation banner")).toBeInTheDocument();
  });

  it("does not show the donation banner while account info is loading", () => {
    mockUseAccountInfo.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<Navigation />, { wrapper });

    expect(screen.queryByLabelText("Donation banner")).not.toBeInTheDocument();
  });

  it("does not show the donation banner when shouldShowDonationBanner is false", async () => {
    mockUseAccountInfo.mockReturnValue({
      data: {
        ...baseAccountInfo,
        shouldShowDonationBanner: false,
      },
      isLoading: false,
    });

    render(<Navigation />, { wrapper });

    await waitFor(() => {
      expect(mockUseAccountInfo).toHaveBeenCalled();
    });

    expect(screen.queryByLabelText("Donation banner")).not.toBeInTheDocument();
  });
});
