import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DonationsBox from "features/donations/DonationsBox";
import { DonationFrequency } from "proto/donations_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

const { t } = i18n;

const initiateDonationMock = service.donations.initiateDonation as jest.MockedFunction<
  typeof service.donations.initiateDonation
>;

describe("DonationsBox", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    initiateDonationMock.mockResolvedValue("https://checkout.stripe.com/c/pay/cs_test_123");
  });

  it("shows the monthly amounts by default", () => {
    render(<DonationsBox />, { wrapper });

    expect(screen.getByText("US$3")).toBeVisible();
    expect(screen.getByText("US$500")).toBeVisible();
    expect(screen.queryByText("US$1,000")).not.toBeInTheDocument();
  });

  it("swaps in the larger amounts when yearly is selected", async () => {
    render(<DonationsBox />, { wrapper });

    await userEvent.click(screen.getByLabelText(t("donations:donations_box.yearly_button_label")));

    expect(screen.getByText("US$25")).toBeVisible();
    expect(screen.getByText("US$1,000")).toBeVisible();
    expect(screen.queryByText("US$3")).not.toBeInTheDocument();
  });

  it("initiates a yearly donation with the selected amount", async () => {
    render(<DonationsBox />, { wrapper });

    await userEvent.click(screen.getByLabelText(t("donations:donations_box.yearly_button_label")));
    await userEvent.click(screen.getByText("US$250"));
    await userEvent.click(screen.getByRole("button", { name: t("donations:donations_box.action_button_label") }));

    await waitFor(() => {
      expect(initiateDonationMock).toHaveBeenCalledWith(250, DonationFrequency.DONATION_FREQUENCY_YEARLY, undefined);
    });
  });

  it("initiates a monthly donation by default", async () => {
    render(<DonationsBox />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: t("donations:donations_box.action_button_label") }));

    await waitFor(() => {
      expect(initiateDonationMock).toHaveBeenCalledWith(10, DonationFrequency.DONATION_FREQUENCY_MONTHLY, undefined);
    });
  });
});
