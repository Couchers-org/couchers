import { UseMutationResult } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { HostRequestStatus } from "proto/conversations_pb";
import { HostRequest, RespondHostRequestReq } from "proto/requests_pb";
import { service } from "service";
import hostRequest from "test/fixtures/hostRequest.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { addDefaultUser } from "test/utils";

import HostRequestSendField from "./HostRequestSendField";

const { t } = i18n;

const getAvailableReferencesMock = service.references
  .getAvailableReferences as jest.MockedFunction<
  typeof service.references.getAvailableReferences
>;

const mockHostRequest: HostRequest.AsObject = {
  ...hostRequest,
  hostingCity: "Los Angeles",
  hostingLat: 34.0522,
  hostingLng: -118.2437,
  hostingRadius: 100,
  needHostRequestFeedback: false,
  isArchived: false,
};

const mockSendMutation: UseMutationResult<
  string | undefined | Empty,
  RpcError,
  string
> = {
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  isPending: false,
  isIdle: true,
  isError: false,
  isSuccess: false,
  data: undefined,
  error: null,
  failureCount: 0,
  failureReason: null,
  isPaused: false,
  status: "idle" as const,
  variables: undefined,
  submittedAt: 0,
  context: undefined,
  reset: jest.fn(),
};

const mockRespondMutation: UseMutationResult<
  unknown,
  RpcError,
  Required<RespondHostRequestReq.AsObject>
> = {
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  isPending: false,
  isIdle: true,
  isError: false,
  isSuccess: false,
  data: undefined,
  error: null,
  failureCount: 0,
  failureReason: null,
  isPaused: false,
  status: "idle" as const,
  variables: undefined,
  submittedAt: 0,
  context: undefined,
  reset: jest.fn(),
};

describe("HostRequestSendField", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAvailableReferencesMock.mockResolvedValue({
      availableWriteReferencesList: [],
      canWriteFriendReference: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the message input and send button", () => {
    render(
      <HostRequestSendField
        hostRequest={mockHostRequest}
        sendMutation={mockSendMutation}
        respondMutation={mockRespondMutation}
      />,
      { wrapper },
    );

    expect(
      screen.getByLabelText(t("messages:chat_input.label"), {
        selector: "textarea",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("global:send") }),
    ).toBeInTheDocument();
  });

  it("disables the send button when the input field is empty", () => {
    render(
      <HostRequestSendField
        hostRequest={mockHostRequest}
        sendMutation={mockSendMutation}
        respondMutation={mockRespondMutation}
      />,
      { wrapper },
    );

    const sendButton = screen.getByRole("button", { name: t("global:send") });
    expect(sendButton).toBeDisabled();
  });

  it("disables the send button when the input contains only whitespace", async () => {
    render(
      <HostRequestSendField
        hostRequest={mockHostRequest}
        sendMutation={mockSendMutation}
        respondMutation={mockRespondMutation}
      />,
      { wrapper },
    );

    const user = userEvent.setup();
    const input = screen.getByLabelText(t("messages:chat_input.label"), {
      selector: "textarea",
    });
    const sendButton = screen.getByRole("button", { name: t("global:send") });

    await user.type(input, "   ");

    expect(sendButton).toBeDisabled();
  });

  it("enables the send button when there is text in the input field", async () => {
    render(
      <HostRequestSendField
        hostRequest={mockHostRequest}
        sendMutation={mockSendMutation}
        respondMutation={mockRespondMutation}
      />,
      { wrapper },
    );

    const user = userEvent.setup();
    const input = screen.getByLabelText(t("messages:chat_input.label"), {
      selector: "textarea",
    });
    const sendButton = screen.getByRole("button", { name: t("global:send") });

    await user.type(input, "Hello, world!");

    expect(sendButton).toBeEnabled();
  });

  it("sends the message when the send button is clicked", async () => {
    render(
      <HostRequestSendField
        hostRequest={mockHostRequest}
        sendMutation={mockSendMutation}
        respondMutation={mockRespondMutation}
      />,
      { wrapper },
    );

    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(t("messages:chat_input.label"), {
        selector: "textarea",
      }),
      "Hello, world!",
    );
    await user.click(screen.getByRole("button", { name: t("global:send") }));

    await waitFor(() => {
      expect(mockSendMutation.mutate).toHaveBeenCalledTimes(1);
    });
    expect(mockSendMutation.mutate).toHaveBeenCalledWith("Hello, world!");
  });

  it("clears the input field after sending a message", async () => {
    render(
      <HostRequestSendField
        hostRequest={mockHostRequest}
        sendMutation={mockSendMutation}
        respondMutation={mockRespondMutation}
      />,
      { wrapper },
    );

    const user = userEvent.setup();
    const input = screen.getByLabelText(t("messages:chat_input.label"), {
      selector: "textarea",
    }) as HTMLTextAreaElement;
    const sendButton = screen.getByRole("button", { name: t("global:send") });

    await user.type(input, "Hello, world!");
    await user.click(sendButton);

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("sends message on Ctrl+Enter key combination", async () => {
    render(
      <HostRequestSendField
        hostRequest={mockHostRequest}
        sendMutation={mockSendMutation}
        respondMutation={mockRespondMutation}
      />,
      { wrapper },
    );

    const user = userEvent.setup();
    const input = screen.getByLabelText(t("messages:chat_input.label"), {
      selector: "textarea",
    });

    await user.type(input, "Hello, world!");
    await user.type(input, "{Control>}{Enter}{/Control}");

    await waitFor(() => {
      expect(mockSendMutation.mutate).toHaveBeenCalledWith("Hello, world!");
    });
  });

  it("disables the send button and input when request is closed (cancelled)", () => {
    const cancelledRequest = {
      ...mockHostRequest,
      status: HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED,
    };

    render(
      <HostRequestSendField
        hostRequest={cancelledRequest}
        sendMutation={mockSendMutation}
        respondMutation={mockRespondMutation}
      />,
      { wrapper },
    );

    const input = document.getElementById(
      "host-request-message",
    ) as HTMLTextAreaElement;
    const sendButton = screen.getByRole("button", { name: t("global:send") });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it("disables the send button and input when request is closed (rejected)", () => {
    const rejectedRequest = {
      ...mockHostRequest,
      status: HostRequestStatus.HOST_REQUEST_STATUS_REJECTED,
    };

    render(
      <HostRequestSendField
        hostRequest={rejectedRequest}
        sendMutation={mockSendMutation}
        respondMutation={mockRespondMutation}
      />,
      { wrapper },
    );

    const input = document.getElementById(
      "host-request-message",
    ) as HTMLTextAreaElement;
    const sendButton = screen.getByRole("button", { name: t("global:send") });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it("displays request closed message when request is cancelled", () => {
    const cancelledRequest = {
      ...mockHostRequest,
      status: HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED,
    };

    render(
      <HostRequestSendField
        hostRequest={cancelledRequest}
        sendMutation={mockSendMutation}
        respondMutation={mockRespondMutation}
      />,
      { wrapper },
    );

    const input = document.getElementById(
      "host-request-message",
    ) as HTMLTextAreaElement;
    expect(input.value).toBe("");
    expect(input.placeholder).toBe(t("messages:request_closed_message"));
  });

  it("does not send the closed-state placeholder text when re-accepting a rejected request", async () => {
    const rejectedRequest = {
      ...mockHostRequest,
      status: HostRequestStatus.HOST_REQUEST_STATUS_REJECTED,
      toDate: "2099-01-05",
    };
    addDefaultUser(rejectedRequest.hostUserId);

    render(
      <HostRequestSendField
        hostRequest={rejectedRequest}
        sendMutation={mockSendMutation}
        respondMutation={mockRespondMutation}
      />,
      { wrapper },
    );

    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: t("global:accept") }),
    );

    await waitFor(() => {
      expect(mockRespondMutation.mutate).toHaveBeenCalledTimes(1);
    });
    expect(mockRespondMutation.mutate).toHaveBeenCalledWith({
      hostRequestId: rejectedRequest.hostRequestId,
      status: HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED,
      text: "",
    });
  });

  it("disables the send button while a message is being sent", async () => {
    const pendingSendMutation: UseMutationResult<
      string | undefined | Empty,
      RpcError,
      string
    > = {
      ...mockSendMutation,
      isPending: true,
      isIdle: false,
      status: "pending" as const,
      variables: "test message",
    };

    render(
      <HostRequestSendField
        hostRequest={mockHostRequest}
        sendMutation={pendingSendMutation}
        respondMutation={mockRespondMutation}
      />,
      { wrapper },
    );

    const user = userEvent.setup();
    const input = screen.getByLabelText(t("messages:chat_input.label"), {
      selector: "textarea",
    });

    // Type some text first
    await user.type(input, "Test message");

    const sendButton = screen.getByRole("button", { name: t("global:send") });
    expect(sendButton).toBeDisabled();
  });

  it("shows Write Reference button when reference is available", async () => {
    const confirmedRequest = {
      ...mockHostRequest,
      status: HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED,
    };

    getAvailableReferencesMock.mockResolvedValue({
      availableWriteReferencesList: [
        {
          hostRequestId: mockHostRequest.hostRequestId,
          referenceType: 0,
        },
      ],
      canWriteFriendReference: false,
    });

    render(
      <HostRequestSendField
        hostRequest={confirmedRequest}
        sendMutation={mockSendMutation}
        respondMutation={mockRespondMutation}
      />,
      { wrapper },
    );

    expect(
      await screen.findByText(t("messages:write_reference_button_text")),
    ).toBeInTheDocument();
  });
});
