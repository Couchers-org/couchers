import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HostRequestStatus } from "proto/conversations_pb";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import HostRequestStatusBanner from "./HostRequestStatusBanner";

const { t } = i18n;

const defaultCallbacks = {
  isLoading: false,
  onAccept: jest.fn(),
  onDecline: jest.fn(),
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

describe("HostRequestStatusBanner — host view", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows accepted message with Edit button", () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost
        status={HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED}
      />,
      { wrapper },
    );
    expect(
      screen.getByText(t("messages:host_request_item.host_status.accepted")),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: t("messages:status_bar_edit_button"),
      }),
    ).toBeVisible();
  });

  it("shows declined message with Edit button", () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost
        status={HostRequestStatus.HOST_REQUEST_STATUS_REJECTED}
      />,
      { wrapper },
    );
    expect(
      screen.getByText(t("messages:host_request_item.host_status.rejected")),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: t("messages:status_bar_edit_button"),
      }),
    ).toBeVisible();
  });

  it("shows confirmed message with Edit button", () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost
        status={HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED}
      />,
      { wrapper },
    );
    expect(
      screen.getByText(t("messages:host_request_item.host_status.confirmed")),
    ).toBeVisible();
  });

  it("renders nothing for pending status", () => {
    const { container } = render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost
        status={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
      />,
      { wrapper },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows Decline and Cancel buttons in edit mode for accepted", async () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost
        status={HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED}
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", {
        name: t("messages:status_bar_edit_button"),
      }),
    );
    expect(
      screen.getByRole("button", {
        name: t("messages:close_request_button_text"),
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: t("messages:status_bar_cancel_edit_button"),
      }),
    ).toBeVisible();
  });

  it("calls onDecline when Decline is clicked in edit mode on accepted", async () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost
        status={HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED}
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", {
        name: t("messages:status_bar_edit_button"),
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: t("messages:close_request_button_text"),
      }),
    );
    expect(defaultCallbacks.onDecline).toHaveBeenCalledTimes(1);
  });

  it("shows Accept and Cancel buttons in edit mode for declined", async () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost
        status={HostRequestStatus.HOST_REQUEST_STATUS_REJECTED}
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", {
        name: t("messages:status_bar_edit_button"),
      }),
    );
    expect(
      screen.getByRole("button", { name: t("global:accept") }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: t("messages:status_bar_cancel_edit_button"),
      }),
    ).toBeVisible();
  });

  it("calls onAccept when Accept is clicked in edit mode on declined", async () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost
        status={HostRequestStatus.HOST_REQUEST_STATUS_REJECTED}
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", {
        name: t("messages:status_bar_edit_button"),
      }),
    );
    await user.click(screen.getByRole("button", { name: t("global:accept") }));
    expect(defaultCallbacks.onAccept).toHaveBeenCalledTimes(1);
  });

  it("exits edit mode when Cancel is clicked", async () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost
        status={HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED}
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", {
        name: t("messages:status_bar_edit_button"),
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: t("messages:status_bar_cancel_edit_button"),
      }),
    );
    expect(
      screen.getByRole("button", {
        name: t("messages:status_bar_edit_button"),
      }),
    ).toBeVisible();
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
      />,
      { wrapper },
    );
    expect(screen.getByText(t("messages:surfer_bar_pending"))).toBeVisible();
    expect(
      screen.getByRole("button", { name: t("messages:cancel_request_button") }),
    ).toBeVisible();
  });

  it("shows confirmation dialog when Cancel request is clicked", async () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: t("messages:cancel_request_button") }),
    );
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(
      screen.getByText(t("messages:cancel_request_dialog_message")),
    ).toBeVisible();
  });

  it("calls onCancel when confirmation dialog is confirmed", async () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_PENDING}
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: t("messages:cancel_request_button") }),
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(defaultCallbacks.onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows accepted message with Confirm and Cancel buttons", () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED}
      />,
      { wrapper },
    );
    expect(
      screen.getByText(t("messages:host_request_item.surfer_status.accepted")),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: t("messages:confirm_request_button_text"),
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: t("messages:cancel_request_button") }),
    ).toBeVisible();
  });

  it("calls onConfirm when Confirm is clicked", async () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED}
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", {
        name: t("messages:confirm_request_button_text"),
      }),
    );
    expect(defaultCallbacks.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows confirmed message with Cancel button only", () => {
    render(
      <HostRequestStatusBanner
        {...defaultCallbacks}
        isHost={false}
        status={HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED}
      />,
      { wrapper },
    );
    expect(
      screen.getByText(t("messages:host_request_item.surfer_status.confirmed")),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: t("messages:cancel_request_button") }),
    ).toBeVisible();
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
