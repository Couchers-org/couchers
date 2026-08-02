import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HostRequestStatus } from "proto/messages_pb";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import HostRequestStatusBanner from "./HostRequestStatusBanner";

const { t } = i18n;

const HOST_NAME = "Alice";

const defaultCallbacks = {
  isLoading: false,
  onAccept: jest.fn(),
  onDecline: jest.fn(),
  onCancel: jest.fn(),
};

describe("HostRequestStatusBanner — host view", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows accepted message with Decline button", () => {
    render(
      <HostRequestStatusBanner {...defaultCallbacks} isHost status={HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED} />,
      { wrapper },
    );
    expect(screen.getByText(t("messages:host_request_item.host_status.accepted_waiting"))).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: t("messages:close_request_button_text"),
      }),
    ).toBeVisible();
  });

  it("shows declined message with Accept button", () => {
    render(
      <HostRequestStatusBanner {...defaultCallbacks} isHost status={HostRequestStatus.HOST_REQUEST_STATUS_REJECTED} />,
      { wrapper },
    );
    expect(screen.getByText(t("messages:host_request_item.host_status.rejected"))).toBeVisible();
    expect(screen.getByRole("button", { name: t("global:accept") })).toBeVisible();
  });

  it("shows confirmed message with Decline button", () => {
    render(
      <HostRequestStatusBanner {...defaultCallbacks} isHost status={HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED} />,
      { wrapper },
    );
    expect(screen.getByText(t("messages:host_request_item.host_status.confirmed"))).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: t("messages:close_request_button_text"),
      }),
    ).toBeVisible();
  });

  it("renders nothing for pending status", () => {
    const { container } = render(
      <HostRequestStatusBanner {...defaultCallbacks} isHost status={HostRequestStatus.HOST_REQUEST_STATUS_PENDING} />,
      { wrapper },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("calls onDecline when Decline is clicked on accepted", async () => {
    render(
      <HostRequestStatusBanner {...defaultCallbacks} isHost status={HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED} />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", {
        name: t("messages:close_request_button_text"),
      }),
    );
    expect(defaultCallbacks.onDecline).toHaveBeenCalledTimes(1);
  });

  it("calls onAccept when Accept is clicked on declined", async () => {
    render(
      <HostRequestStatusBanner {...defaultCallbacks} isHost status={HostRequestStatus.HOST_REQUEST_STATUS_REJECTED} />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: t("global:accept") }));
    expect(defaultCallbacks.onAccept).toHaveBeenCalledTimes(1);
  });
});

describe("HostRequestStatusBanner — surfer view", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows pending message with Cancel request button", () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
        hostName={HOST_NAME}
      />,
      { wrapper },
    );
    expect(screen.getByText(t("messages:surfer_bar_pending", { name: HOST_NAME }))).toBeVisible();
    expect(screen.getByRole("button", { name: t("messages:cancel_request_button") })).toBeVisible();
  });

  it("shows confirmation dialog when Cancel request is clicked", async () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
        hostName={HOST_NAME}
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: t("messages:cancel_request_button") }));
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.getByText(t("messages:cancel_request_dialog_message"))).toBeVisible();
  });

  it("calls onCancel when confirmation dialog is confirmed", async () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
        hostName={HOST_NAME}
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: t("messages:cancel_request_button") }));
    await user.click(
      screen.getByRole("button", {
        name: t("messages:cancel_request_dialog_confirm_button"),
      }),
    );
    expect(defaultCallbacks.onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders nothing for accepted status (confirm card handles this)", () => {
    const { container } = render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED}
      />,
      { wrapper },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows confirmed message with Cancel button only", () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED}
        hostName={HOST_NAME}
      />,
      { wrapper },
    );
    expect(
      screen.getByText(
        t("messages:host_request_item.surfer_status.confirmed", {
          name: HOST_NAME,
        }),
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: t("messages:cancel_request_button") })).toBeVisible();
    expect(
      screen.queryByRole("button", {
        name: t("messages:confirm_request_button_text"),
      }),
    ).not.toBeInTheDocument();
  });

  it("renders nothing for declined status", () => {
    const { container } = render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_REJECTED}
      />,
      { wrapper },
    );
    expect(container).toBeEmptyDOMElement();
  });
});
