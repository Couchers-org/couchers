import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("DonationBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the donation banner when user is authenticated", () => {
    render(<DonationBanner />, { wrapper });

    expect(screen.getByText(t("donation_banner.message"))).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: t("donation_banner.button"),
      }),
    ).toBeInTheDocument();
  });

  it("navigates to donations page with utm_source when button is clicked", async () => {
    const user = userEvent.setup();
    render(<DonationBanner />, { wrapper });

    const donateButton = screen.getByRole("button", {
      name: t("donation_banner.button"),
    });
    await user.click(donateButton);

    expect(mockPush).toHaveBeenCalledWith(
      `${donationsRoute}?utm_source=donation_banner`,
    );
  });

  it("can be dismissed by clicking the close button", async () => {
    const user = userEvent.setup();
    render(<DonationBanner />, { wrapper });

    const closeButton = screen.getByLabelText("Close");
    await user.click(closeButton);

    // Banner should be removed from DOM
    expect(
      screen.queryByText(t("donation_banner.message")),
    ).not.toBeInTheDocument();
  });

  it("shows again after unmounting and remounting", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<DonationBanner />, { wrapper });
    const closeButton = screen.getByLabelText("Close");
    await user.click(closeButton);

    expect(
      screen.queryByText(t("donation_banner.message")),
    ).not.toBeInTheDocument();

    unmount();
    render(<DonationBanner />, { wrapper });

    expect(screen.getByText(t("donation_banner.message"))).toBeInTheDocument();
  });
});
