import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HostRequestStatus } from "proto/conversations_pb";
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
