import { render, screen } from "@testing-library/react";
import DonationProgressBar from "features/donations/DonationProgressBar";
import useDonationStats from "features/donations/useDonationStats";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

const { t } = i18n;

jest.mock("features/donations/useDonationStats");

const mockUseDonationStats = useDonationStats as jest.MockedFunction<typeof useDonationStats>;

describe("DonationProgressBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays loading skeleton when donation stats are loading", () => {
    mockUseDonationStats.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useDonationStats>);

    const { container } = render(<DonationProgressBar />, { wrapper });

    // Should show skeleton loaders (MUI Skeleton components)
    const skeletons = container.querySelectorAll(".MuiSkeleton-root");
    expect(skeletons.length).toBe(2); // One for progress bar, one for text
  });

  it("does not display when donation stats are not available", () => {
    mockUseDonationStats.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useDonationStats>);

    const { container } = render(<DonationProgressBar />, { wrapper });

    // Component should return null, so container should be empty
    expect(container.firstChild).toBeNull();
  });

  it("displays progress bar with correct values", () => {
    mockUseDonationStats.mockReturnValue({
      data: {
        totalDonatedYtd: 5000,
        goal: 10000,
      },
      isLoading: false,
    } as ReturnType<typeof useDonationStats>);

    render(<DonationProgressBar />, { wrapper });

    const progressBar = screen.getByRole("progressbar", {
      name: t("donation_banner.progress_label"),
    });
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("$5,000 / $10,000")).toBeInTheDocument();
  });

  it("displays correct progress percentage for 75%", () => {
    mockUseDonationStats.mockReturnValue({
      data: {
        totalDonatedYtd: 7500,
        goal: 10000,
      },
      isLoading: false,
    } as ReturnType<typeof useDonationStats>);

    render(<DonationProgressBar />, { wrapper });

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "75");
    expect(screen.getByText("$7,500 / $10,000")).toBeInTheDocument();
  });

  it("caps progress at 100% when donations exceed goal", () => {
    mockUseDonationStats.mockReturnValue({
      data: {
        totalDonatedYtd: 15000,
        goal: 10000,
      },
      isLoading: false,
    } as ReturnType<typeof useDonationStats>);

    render(<DonationProgressBar />, { wrapper });

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("$15,000 / $10,000")).toBeInTheDocument();
  });

  it("formats large numbers with commas", () => {
    mockUseDonationStats.mockReturnValue({
      data: {
        totalDonatedYtd: 123456,
        goal: 500000,
      },
      isLoading: false,
    } as ReturnType<typeof useDonationStats>);

    render(<DonationProgressBar />, { wrapper });

    expect(screen.getByText("$123,456 / $500,000")).toBeInTheDocument();
  });

  it("handles zero donations", () => {
    mockUseDonationStats.mockReturnValue({
      data: {
        totalDonatedYtd: 0,
        goal: 10000,
      },
      isLoading: false,
    } as ReturnType<typeof useDonationStats>);

    render(<DonationProgressBar />, { wrapper });

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText("$0 / $10,000")).toBeInTheDocument();
  });
});
