import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HostRequestStatus } from "proto/messages_pb";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import HostRequestRespondButtons from "./HostRequestRespondButtons";

const { t } = i18n;

describe("HostRequestRespondButtons", () => {
  it("renders nothing for non-host", () => {
    const { container } = render(
      <HostRequestRespondButtons
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
        isLoading={false}
        handleStatus={jest.fn().mockReturnValue(jest.fn())}
      />,
      { wrapper },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when status is not pending", () => {
    const { container } = render(
      <HostRequestRespondButtons
        isHost
        status={HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED}
        isLoading={false}
        handleStatus={jest.fn().mockReturnValue(jest.fn())}
      />,
      { wrapper },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows Accept and Decline buttons for host with pending request", () => {
    render(
      <HostRequestRespondButtons
        isHost
        status={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
        isLoading={false}
        handleStatus={jest.fn().mockReturnValue(jest.fn())}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole("button", { name: t("global:accept") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: t("messages:close_request_button_text"),
      }),
    ).toBeInTheDocument();
  });

  it("calls the accept callback when Accept is clicked", async () => {
    const acceptCallback = jest.fn();
    const handleStatus = jest
      .fn()
      .mockImplementation((status) =>
        status === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED
          ? acceptCallback
          : jest.fn(),
      );
    render(
      <HostRequestRespondButtons
        isHost
        status={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
        isLoading={false}
        handleStatus={handleStatus}
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: t("global:accept") }));
    expect(acceptCallback).toHaveBeenCalledTimes(1);
  });

  it("calls the decline callback when Decline is clicked", async () => {
    const declineCallback = jest.fn();
    const handleStatus = jest
      .fn()
      .mockImplementation((status) =>
        status === HostRequestStatus.HOST_REQUEST_STATUS_REJECTED
          ? declineCallback
          : jest.fn(),
      );
    render(
      <HostRequestRespondButtons
        isHost
        status={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
        isLoading={false}
        handleStatus={handleStatus}
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", {
        name: t("messages:close_request_button_text"),
      }),
    );
    expect(declineCallback).toHaveBeenCalledTimes(1);
  });
});

describe("HostRequestRespondButtons — surfer confirm card", () => {
  it("renders nothing for surfer when status is not accepted", () => {
    const { container } = render(
      <HostRequestRespondButtons
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
        isLoading={false}
        handleStatus={jest.fn().mockReturnValue(jest.fn())}
      />,
      { wrapper },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows confirm card with Confirm and Cancel request buttons for surfer+accepted", () => {
    const name = "Alice";
    render(
      <HostRequestRespondButtons
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED}
        isLoading={false}
        handleStatus={jest.fn().mockReturnValue(jest.fn())}
        name={name}
      />,
      { wrapper },
    );
    expect(
      screen.getByText(t("messages:surfer_confirm_box_title", { name })),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: t("messages:confirm_request_button_text"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("messages:cancel_request_button") }),
    ).toBeInTheDocument();
  });

  it("calls confirm callback when Confirm is clicked", async () => {
    const confirmCallback = jest.fn();
    const handleStatus = jest
      .fn()
      .mockImplementation((status) =>
        status === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED
          ? confirmCallback
          : jest.fn(),
      );
    render(
      <HostRequestRespondButtons
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED}
        isLoading={false}
        handleStatus={handleStatus}
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", {
        name: t("messages:confirm_request_button_text"),
      }),
    );
    expect(confirmCallback).toHaveBeenCalledTimes(1);
  });

  it("shows cancel confirmation dialog when Cancel request is clicked", async () => {
    render(
      <HostRequestRespondButtons
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED}
        isLoading={false}
        handleStatus={jest.fn().mockReturnValue(jest.fn())}
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: t("messages:cancel_request_button") }),
    );
    expect(screen.getByRole("dialog")).toBeVisible();
  });
});

describe("HostRequestRespondButtons — public-trip offer", () => {
  it("shows the offering host a Withdraw card, not Accept/Decline, while pending", () => {
    render(
      <HostRequestRespondButtons
        isHost
        isOffer
        status={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
        isLoading={false}
        handleStatus={jest.fn().mockReturnValue(jest.fn())}
        name="Aapeli"
      />,
      { wrapper },
    );
    expect(
      screen.getByRole("button", {
        name: t("messages:withdraw_offer_button"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: t("global:accept") }),
    ).not.toBeInTheDocument();
  });

  it("withdrawing the offer opens a confirmation dialog", async () => {
    render(
      <HostRequestRespondButtons
        isHost
        isOffer
        status={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
        isLoading={false}
        handleStatus={jest.fn().mockReturnValue(jest.fn())}
        name="Aapeli"
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: t("messages:withdraw_offer_button") }),
    );
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("shows the traveller Accept/Decline, not Withdraw, while pending", () => {
    render(
      <HostRequestRespondButtons
        isHost={false}
        isOffer
        status={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
        isLoading={false}
        handleStatus={jest.fn().mockReturnValue(jest.fn())}
        name="Luca"
      />,
      { wrapper },
    );
    expect(
      screen.getByRole("button", { name: t("global:accept") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: t("messages:close_request_button_text"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: t("messages:withdraw_offer_button"),
      }),
    ).not.toBeInTheDocument();
  });

  it("shows the traveller a confirmation banner once they've accepted", () => {
    render(
      <HostRequestRespondButtons
        isHost={false}
        isOffer
        status={HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED}
        isLoading={false}
        handleStatus={jest.fn().mockReturnValue(jest.fn())}
        name="Luca"
      />,
      { wrapper },
    );
    expect(
      screen.getByText(
        t("messages:offer_accept_confirmation", { name: "Luca" }),
      ),
    ).toBeInTheDocument();
  });
});
