import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useAccountInfo from "features/auth/useAccountInfo";
import { DonationBanner } from "features/donations/DonationBanner";
import useDonationStats from "features/donations/useDonationStats";
import { donationsRoute } from "routes";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

const { t } = i18n;

const mockPush = jest.fn();
jest.mock("next/router", () => ({
  __esModule: true,
  useRouter: () => ({
    push: mockPush,
  }),
  default: {
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
  },
}));

jest.mock("features/auth/useAccountInfo");
jest.mock("features/donations/useDonationStats");

const mockUseAccountInfo = useAccountInfo as jest.MockedFunction<typeof useAccountInfo>;
const mockUseDonationStats = useDonationStats as jest.MockedFunction<typeof useDonationStats>;

const defaultDonationStats = {
  totalDonatedYtd: 5000,
  goal: 10000,
};

describe("DonationBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Default mock for donation stats
    mockUseDonationStats.mockReturnValue({
      data: defaultDonationStats,
      isLoading: false,
    } as ReturnType<typeof useDonationStats>);
  });

  it("displays the donation banner when shouldShowDonationBanner is true", async () => {
    mockUseAccountInfo.mockReturnValue({
      data: {
        shouldShowDonationBanner: true,
      },
      isLoading: false,
    } as ReturnType<typeof useAccountInfo>);

    render(<DonationBanner />, { wrapper });

    await waitFor(() => {
      // Check for static part of the message (goal is now dynamically interpolated)
      expect(screen.getByText(/Couchers\.org runs on kindness/)).toBeInTheDocument();
    });

    // Should also show the progress bar
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("$5,000 / $10,000")).toBeInTheDocument();
  });

  it("navigates to donations page with utm_source when button is clicked", async () => {
    mockUseAccountInfo.mockReturnValue({
      data: {
        shouldShowDonationBanner: true,
      },
      isLoading: false,
    } as ReturnType<typeof useAccountInfo>);

    const user = userEvent.setup();
    render(<DonationBanner />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Couchers\.org runs on kindness/)).toBeInTheDocument();
    });

    const donateButton = screen.getByRole("button", {
      name: t("donation_banner.button"),
    });
    await user.click(donateButton);

    expect(mockPush).toHaveBeenCalledWith(`${donationsRoute}?utm_source=donation_banner`);
  });

  it("can be dismissed by clicking the close button", async () => {
    mockUseAccountInfo.mockReturnValue({
      data: {
        shouldShowDonationBanner: true,
      },
      isLoading: false,
    } as ReturnType<typeof useAccountInfo>);

    const user = userEvent.setup();
    render(<DonationBanner />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Couchers\.org runs on kindness/)).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText("Close");
    await user.click(closeButton);

    // Banner should be removed from DOM
    expect(screen.queryByText(/Couchers\.org runs on kindness/)).not.toBeInTheDocument();

    // Verify dismissal timestamp is stored in localStorage
    const stored = localStorage.getItem("donation_banner.dismissed");
    expect(stored).not.toBeNull();
  });

  it("does not show again within 24 hours after dismissal", async () => {
    mockUseAccountInfo.mockReturnValue({
      data: {
        shouldShowDonationBanner: true,
      },
      isLoading: false,
    } as ReturnType<typeof useAccountInfo>);

    const user = userEvent.setup();
    const { unmount } = render(<DonationBanner />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Couchers\.org runs on kindness/)).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText("Close");
    await user.click(closeButton);

    expect(screen.queryByText(/Couchers\.org runs on kindness/)).not.toBeInTheDocument();

    unmount();
    render(<DonationBanner />, { wrapper });

    // Banner should NOT appear after remounting within 24 hours
    expect(screen.queryByText(/Couchers\.org runs on kindness/)).not.toBeInTheDocument();
  });

  it("shows again after 24 hours have passed since dismissal", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-01-01 12:00:00"));

    mockUseAccountInfo.mockReturnValue({
      data: {
        shouldShowDonationBanner: true,
      },
      isLoading: false,
    } as ReturnType<typeof useAccountInfo>);

    const user = userEvent.setup({ delay: null });
    const { unmount } = render(<DonationBanner />, { wrapper });

    expect(await screen.findByText(/Couchers\.org runs on kindness/)).toBeVisible();

    const closeButton = screen.getByLabelText("Close");
    await user.click(closeButton);

    expect(screen.queryByText(/Couchers\.org runs on kindness/)).not.toBeInTheDocument();

    unmount();

    // Advance time by 24 hours + 1 second
    jest.setSystemTime(new Date("2021-01-02 12:00:01"));

    render(<DonationBanner />, { wrapper });

    // Banner should appear again after 24 hours have passed
    expect(await screen.findByText(/Couchers\.org runs on kindness/)).toBeVisible();

    jest.useRealTimers();
  });

  it("does not display the donation banner when shouldShowDonationBanner is false", () => {
    mockUseAccountInfo.mockReturnValue({
      data: {
        shouldShowDonationBanner: false,
      },
      isLoading: false,
    } as ReturnType<typeof useAccountInfo>);

    render(<DonationBanner />, { wrapper });

    expect(screen.queryByText(/Couchers\.org runs on kindness/)).not.toBeInTheDocument();
  });

  it("does not display the donation banner when account info is loading", () => {
    mockUseAccountInfo.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useAccountInfo>);

    render(<DonationBanner />, { wrapper });

    expect(screen.queryByText(/Couchers\.org runs on kindness/)).not.toBeInTheDocument();
  });

  it("does not display the donation banner when account info is undefined", () => {
    mockUseAccountInfo.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useAccountInfo>);

    render(<DonationBanner />, { wrapper });

    expect(screen.queryByText(/Couchers\.org runs on kindness/)).not.toBeInTheDocument();
  });

  it("does not display the donation banner when shouldShowDonationBanner property is missing", () => {
    mockUseAccountInfo.mockReturnValue({
      data: {} as ReturnType<typeof useAccountInfo>["data"],
      isLoading: false,
    } as ReturnType<typeof useAccountInfo>);

    render(<DonationBanner />, { wrapper });

    expect(screen.queryByText(/Couchers\.org runs on kindness/)).not.toBeInTheDocument();
  });

  it("does not show if dismissed within 24 hours, even if backend says to show", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-01-01 12:00:00"));

    mockUseAccountInfo.mockReturnValue({
      data: {
        shouldShowDonationBanner: true,
      },
      isLoading: false,
    } as ReturnType<typeof useAccountInfo>);

    const user = userEvent.setup({ delay: null });
    const { unmount } = render(<DonationBanner />, { wrapper });

    expect(await screen.findByText(/Couchers\.org runs on kindness/)).toBeVisible();

    const closeButton = screen.getByLabelText("Close");
    await user.click(closeButton);

    unmount();

    // Advance time by less than 24 hours (23 hours, 59 minutes)
    jest.setSystemTime(new Date("2021-01-02 11:59:00"));

    render(<DonationBanner />, { wrapper });

    // Banner should still NOT appear
    expect(screen.queryByText(/Couchers\.org runs on kindness/)).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it("displays correct progress percentage", async () => {
    mockUseAccountInfo.mockReturnValue({
      data: {
        shouldShowDonationBanner: true,
      },
      isLoading: false,
    } as ReturnType<typeof useAccountInfo>);

    mockUseDonationStats.mockReturnValue({
      data: {
        totalDonatedYtd: 7500,
        goal: 10000,
      },
      isLoading: false,
    } as ReturnType<typeof useDonationStats>);

    render(<DonationBanner />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Couchers\.org runs on kindness/)).toBeInTheDocument();
    });

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "75");
    expect(screen.getByText("$7,500 / $10,000")).toBeInTheDocument();
  });

  it("caps progress at 100% when donations exceed goal", async () => {
    mockUseAccountInfo.mockReturnValue({
      data: {
        shouldShowDonationBanner: true,
      },
      isLoading: false,
    } as ReturnType<typeof useAccountInfo>);

    mockUseDonationStats.mockReturnValue({
      data: {
        totalDonatedYtd: 15000,
        goal: 10000,
      },
      isLoading: false,
    } as ReturnType<typeof useDonationStats>);

    render(<DonationBanner />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Couchers\.org runs on kindness/)).toBeInTheDocument();
    });

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("$15,000 / $10,000")).toBeInTheDocument();
  });
});
