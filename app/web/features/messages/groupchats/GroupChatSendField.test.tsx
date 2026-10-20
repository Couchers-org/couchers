import { UseMutationResult } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import groupChat from "test/fixtures/groupChat.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import GroupChatSendField from "./GroupChatSendField";

const { t } = i18n;

const mockSendMutation: UseMutationResult<string | undefined | Empty, RpcError, string> = {
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

describe("GroupChatSendField", () => {
  const chatId = groupChat.groupChatId;
  const currentUserId = groupChat.memberUserIdsList[0];

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("disables the send button when the input field is empty", () => {
    render(<GroupChatSendField sendMutation={mockSendMutation} chatId={chatId} currentUserId={currentUserId} />, {
      wrapper,
    });

    const sendButton = screen.getByRole("button", { name: t("global:send") });
    expect(sendButton).toBeDisabled();
  });

  it("disables the send button when the input contains only whitespace", async () => {
    render(<GroupChatSendField sendMutation={mockSendMutation} chatId={chatId} currentUserId={currentUserId} />, {
      wrapper,
    });

    const user = userEvent.setup();
    const input = screen.getByLabelText(t("messages:chat_input.label"));
    const sendButton = screen.getByRole("button", { name: t("global:send") });

    await user.type(input, "   ");

    expect(sendButton).toBeDisabled();
  });

  it("enables the send button when there is text in the input field", async () => {
    render(<GroupChatSendField sendMutation={mockSendMutation} chatId={chatId} currentUserId={currentUserId} />, {
      wrapper,
    });

    const user = userEvent.setup();
    const input = screen.getByLabelText(t("messages:chat_input.label"));
    const sendButton = screen.getByRole("button", { name: t("global:send") });

    await user.type(input, "Hello, world!");

    expect(sendButton).toBeEnabled();
  });

  it("sends the message when the send button is clicked", async () => {
    render(<GroupChatSendField sendMutation={mockSendMutation} chatId={chatId} currentUserId={currentUserId} />, {
      wrapper,
    });

    const user = userEvent.setup();
    const input = screen.getByLabelText(t("messages:chat_input.label"));
    const sendButton = screen.getByRole("button", { name: t("global:send") });

    await user.type(input, "Hello, world!");
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockSendMutation.mutate).toHaveBeenCalledTimes(1);
    });
    expect(mockSendMutation.mutate).toHaveBeenCalledWith("Hello, world!");
  });

  it("clears the input field after sending a message", async () => {
    render(<GroupChatSendField sendMutation={mockSendMutation} chatId={chatId} currentUserId={currentUserId} />, {
      wrapper,
    });

    const user = userEvent.setup();
    const input = screen.getByLabelText(t("messages:chat_input.label")) as HTMLInputElement;
    const sendButton = screen.getByRole("button", { name: t("global:send") });

    await user.type(input, "Hello, world!");
    await user.click(sendButton);

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("sends message on Ctrl+Enter key combination", async () => {
    render(<GroupChatSendField sendMutation={mockSendMutation} chatId={chatId} currentUserId={currentUserId} />, {
      wrapper,
    });

    const user = userEvent.setup();
    const input = screen.getByLabelText(t("messages:chat_input.label"));

    await user.type(input, "Hello, world!");
    await user.type(input, "{Control>}{Enter}{/Control}");

    await waitFor(() => {
      expect(mockSendMutation.mutate).toHaveBeenCalledWith("Hello, world!");
    });
  });

  it("trims trailing whitespace from the message before sending", async () => {
    render(<GroupChatSendField sendMutation={mockSendMutation} chatId={chatId} currentUserId={currentUserId} />, {
      wrapper,
    });

    const user = userEvent.setup();
    const input = screen.getByLabelText(t("messages:chat_input.label"));
    const sendButton = screen.getByRole("button", { name: t("global:send") });

    await user.type(input, "Hello, world!   ");
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockSendMutation.mutate).toHaveBeenCalledWith("Hello, world!");
    });
  });

  it("disables the send button while a message is being sent", () => {
    const pendingSendMutation: UseMutationResult<string | undefined | Empty, RpcError, string> = {
      ...mockSendMutation,
      isPending: true,
      isIdle: false,
      status: "pending" as const,
      variables: "test message",
    };

    render(<GroupChatSendField sendMutation={pendingSendMutation} chatId={chatId} currentUserId={currentUserId} />, {
      wrapper,
    });

    const sendButton = screen.getByRole("button", { name: t("global:send") });
    expect(sendButton).toBeDisabled();
  });

  it("persists message text in session storage", async () => {
    render(<GroupChatSendField sendMutation={mockSendMutation} chatId={chatId} currentUserId={currentUserId} />, {
      wrapper,
    });

    const user = userEvent.setup();
    const input = screen.getByLabelText(t("messages:chat_input.label"));

    await user.type(input, "Draft message");

    await waitFor(() => {
      const persisted = sessionStorage.getItem(`messages.${currentUserId}.${chatId}`);
      expect(persisted).toBe('"Draft message"');
    });
  });

  it("clears persisted message from session storage after sending", async () => {
    render(<GroupChatSendField sendMutation={mockSendMutation} chatId={chatId} currentUserId={currentUserId} />, {
      wrapper,
    });

    const user = userEvent.setup();
    const input = screen.getByLabelText(t("messages:chat_input.label"));
    const sendButton = screen.getByRole("button", { name: t("global:send") });

    await user.type(input, "Hello, world!");
    await user.click(sendButton);

    await waitFor(() => {
      const persisted = sessionStorage.getItem(`messages.${currentUserId}.${chatId}`);
      expect(persisted).toBeNull();
    });
  });
});
