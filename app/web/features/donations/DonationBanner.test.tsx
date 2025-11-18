import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useAccountInfo from "features/auth/useAccountInfo";
import { DonationBanner } from "features/donations/DonationBanner";
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

const mockUseAccountInfo = useAccountInfo as jest.MockedFunction<
  typeof useAccountInfo
>;

describe("DonationBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(
        screen.getByText(t("donation_banner.message")),
      ).toBeInTheDocument();
    });
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
      expect(
        screen.getByText(t("donation_banner.message")),
      ).toBeInTheDocument();
    });

    const donateButton = screen.getByRole("button", {
      name: t("donation_banner.button"),
    });
    await user.click(donateButton);

    expect(mockPush).toHaveBeenCalledWith(
      `${donationsRoute}?utm_source=donation_banner`,
    );
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
      expect(
        screen.getByText(t("donation_banner.message")),
      ).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText("Close");
    await user.click(closeButton);

    // Banner should be removed from DOM
    expect(
      screen.queryByText(t("donation_banner.message")),
    ).not.toBeInTheDocument();
  });

  it("shows again after unmounting and remounting", async () => {
    mockUseAccountInfo.mockReturnValue({
      data: {
        shouldShowDonationBanner: true,
      },
      isLoading: false,
    } as ReturnType<typeof useAccountInfo>);

    const user = userEvent.setup();
    const { unmount } = render(<DonationBanner />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByText(t("donation_banner.message")),
      ).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText("Close");
    await user.click(closeButton);

    expect(
      screen.queryByText(t("donation_banner.message")),
    ).not.toBeInTheDocument();

    unmount();
    render(<DonationBanner />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByText(t("donation_banner.message")),
      ).toBeInTheDocument();
    });
  });

  it("does not display the donation banner when shouldShowDonationBanner is false", () => {
    mockUseAccountInfo.mockReturnValue({
      data: {
        shouldShowDonationBanner: false,
      },
      isLoading: false,
    } as ReturnType<typeof useAccountInfo>);

    render(<DonationBanner />, { wrapper });

    expect(
      screen.queryByText(t("donation_banner.message")),
    ).not.toBeInTheDocument();
  });

  it("does not display the donation banner when account info is loading", () => {
    mockUseAccountInfo.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useAccountInfo>);

    render(<DonationBanner />, { wrapper });

    expect(
      screen.queryByText(t("donation_banner.message")),
    ).not.toBeInTheDocument();
  });

  it("does not display the donation banner when account info is undefined", () => {
    mockUseAccountInfo.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useAccountInfo>);

    render(<DonationBanner />, { wrapper });

    expect(
      screen.queryByText(t("donation_banner.message")),
    ).not.toBeInTheDocument();
  });

  it("does not display the donation banner when shouldShowDonationBanner property is missing", () => {
    mockUseAccountInfo.mockReturnValue({
      data: {} as ReturnType<typeof useAccountInfo>["data"],
      isLoading: false,
    } as ReturnType<typeof useAccountInfo>);

    render(<DonationBanner />, { wrapper });

    expect(
      screen.queryByText(t("donation_banner.message")),
    ).not.toBeInTheDocument();
  });
});
