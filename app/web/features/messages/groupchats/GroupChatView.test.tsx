import {
  act,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MARK_LAST_SEEN_TIMEOUT } from "features/messages/constants";
import GroupChatView from "features/messages/groupchats/GroupChatView";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import {
  mockAllIsIntersecting,
  mockIsIntersecting,
} from "react-intersection-observer/test-utils";
import { service } from "service";
import messageData from "test/fixtures/messages.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getGroupChatMessages, getUser } from "test/serviceMockDefaults";
import {
  addDefaultUser,
  assertErrorAlert,
  mockConsoleError,
  MockedService,
  t,
  wait,
} from "test/utils";

import { GROUP_CHAT_REFETCH_INTERVAL } from "./constants";

const getGroupChatMock = service.conversations.getGroupChat as MockedService<
  typeof service.conversations.getGroupChat
>;
const getUserMock = service.user.getUser as jest.Mock;
const listFriendsMock = service.api.listFriends as MockedService<
  typeof service.api.listFriends
>;

const getGroupChatMessagesMock = service.conversations
  .getGroupChatMessages as MockedService<
  typeof service.conversations.getGroupChatMessages
>;
const baseGroupChatMockResponse = {
  adminUserIdsList: [1],
  groupChatId: 1,
  isDm: false,
  lastSeenMessageId: 1,
  latestMessage: {
    authorUserId: 3,
    messageId: 5,
    text: {
      text: "In 2 hours?",
    },
    time: {
      nanos: 0,
      seconds: 1577900000,
    },
  },
  memberUserIdsList: [1, 2, 3],
  onlyAdminsInvite: false,
  title: "Test group chat",
  unseenMessageCount: 4,
  muteInfo: {
    muted: false,
    mutedUntil: undefined,
  },
};

const markLastSeenGroupChatMock = service.conversations
  .markLastSeenGroupChat as MockedService<
  typeof service.conversations.markLastSeenGroupChat
>;

const muteChatMock = service.conversations.muteChat as MockedService<
  typeof service.conversations.muteChat
>;

// TODO: tests involving these mutations - maybe these can be localised only
// in test blocks that need them
const sendMessageMock = service.conversations.sendMessage as MockedService<
  typeof service.conversations.sendMessage
>;
// const leaveGroupChatMock = service.conversations
//   .leaveGroupChat as MockedService<typeof service.conversations.leaveGroupChat>;

beforeEach(() => {
  addDefaultUser();
});

function renderGroupChatView() {
  const { client, wrapper } = getHookWrapperWithClient();
  render(<GroupChatView chatId={1} />, { wrapper });

  return client;
}

describe("GroupChatView", () => {
  beforeEach(() => {
    getGroupChatMock.mockResolvedValue(baseGroupChatMockResponse);
    getGroupChatMessagesMock.mockImplementation(getGroupChatMessages);
    getUserMock.mockImplementation(getUser);
    markLastSeenGroupChatMock.mockResolvedValue(new Empty());
    listFriendsMock.mockResolvedValue([1, 2]);
  });

  it("renders the chat correctly", async () => {
    renderGroupChatView();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Test group chat" })
    ).toBeVisible();

    const messageElements = within(
      screen.getByTestId("message-list")
    ).getAllByTestId(/message-\d/);

    for (let i = 0; i < messageData.length; i++) {
      const message = messageData[i];
      const messageElement = within(messageElements[i]);
      expect(messageElement.getByText(/ago$/)).toBeVisible();

      if (message.text?.text) {
        // non-control text message assertions
        const user = await getUser(message.authorUserId.toString());

        expect(
          messageElement.getByRole("heading", { name: user?.name })
        ).toBeVisible();
        expect(messageElement.getByText(message.text.text)).toBeVisible();

        // avatar assertion
        if (user?.avatarUrl !== "") {
          // checks that an image is rendered if an avatar exists
          expect(
            messageElement.getByRole("img", { name: user?.name })
          ).toBeVisible();
        } else {
          // "Funny Dog" is the only user without an image, so check initials are rendered
          expect(messageElement.getByText("FD")).toBeVisible();
        }
      } else if (message.chatCreated) {
        // control message assertions
        expect(
          messageElement.getByText("Funny created the chat")
        ).toBeVisible();
      }
    }
    expect(getGroupChatMock).toHaveBeenCalledTimes(1);
    // 1 is groupChatId here
    expect(getGroupChatMock).toHaveBeenCalledWith(1);
    expect(getGroupChatMessagesMock).toHaveBeenCalledTimes(1);
    expect(getGroupChatMessagesMock).toHaveBeenCalledWith(1, undefined);
  });

  describe("when there are new messages due to come in", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("shows the new messages", async () => {
      getGroupChatMock
        .mockResolvedValueOnce(baseGroupChatMockResponse)
        .mockResolvedValue({
          ...baseGroupChatMockResponse,
          latestMessage: {
            authorUserId: 1,
            messageId: 6,
            text: {
              text: "Sounds good",
            },
            time: {
              nanos: 0,
              seconds: 1577962000,
            },
          },
        });
      getGroupChatMessagesMock
        .mockImplementationOnce(getGroupChatMessages)
        .mockResolvedValue({
          lastMessageId: 6,
          messagesList: [
            {
              messageId: 6,
              authorUserId: 1,
              text: { text: "Sounds good" },
              time: { seconds: 1577962000, nanos: 0 },
            },
            ...messageData,
          ],
          noMore: true,
        });
      renderGroupChatView();

      act(() => {
        jest.runOnlyPendingTimers();
      });

      let messages = await screen.findAllByTestId(/message-\d/);
      expect(messages).toHaveLength(5);
      expect(getGroupChatMock).toHaveBeenCalledTimes(1);
      expect(getGroupChatMessagesMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(GROUP_CHAT_REFETCH_INTERVAL);
      });

      messages = screen.getAllByTestId(/message-\d/);
      expect(messages).toHaveLength(6);
      expect(within(messages[0]).getByText("Sounds good")).toBeVisible();
      expect(getGroupChatMock).toHaveBeenCalledTimes(2);
      expect(getGroupChatMock.mock.calls).toEqual([[1], [1]]);
      expect(getGroupChatMessagesMock).toHaveBeenCalledTimes(2);
      expect(getGroupChatMessagesMock.mock.calls).toEqual([
        [1, undefined],
        [1, undefined],
      ]);
    });
  });

  it("should mark the message seen with the latest message if they are all visible", async () => {
    renderGroupChatView();
    await screen.findByText(messageData[0].text!.text);

    mockAllIsIntersecting(true);
    await wait(MARK_LAST_SEEN_TIMEOUT + 1);

    expect(markLastSeenGroupChatMock).toHaveBeenCalledTimes(1);
    // (groupChatId, messageId)
    expect(markLastSeenGroupChatMock).toHaveBeenCalledWith(1, 5);
  });

  it("should only mark the latest visible message if only some are visible", async () => {
    renderGroupChatView();
    await screen.findByText(messageData[0].text!.text);

    // Only message 1, 2 and 3 are visible
    const visibleMessages = screen.getAllByTestId(/message-[123]/);
    visibleMessages.forEach((message) => {
      mockIsIntersecting(message, true);
    });
    await wait(MARK_LAST_SEEN_TIMEOUT + 1);

    expect(markLastSeenGroupChatMock).toHaveBeenCalledTimes(1);
    expect(markLastSeenGroupChatMock).toHaveBeenCalledWith(1, 3);
  });

  it("should not try to mark any message as seen if they have all been seen", async () => {
    getGroupChatMock.mockResolvedValue({
      ...baseGroupChatMockResponse,
      lastSeenMessageId: 5,
      unseenMessageCount: 0,
    });
    renderGroupChatView();
    await screen.findByText(messageData[0].text!.text);

    mockAllIsIntersecting(true);
    await wait(MARK_LAST_SEEN_TIMEOUT + 1);

    expect(markLastSeenGroupChatMock).not.toHaveBeenCalled();
  });

  it("sends the message successfully and shows it in the chat", async () => {
    sendMessageMock.mockResolvedValue(new Empty());
    getGroupChatMock
      .mockResolvedValueOnce(baseGroupChatMockResponse)
      .mockResolvedValue({
        ...baseGroupChatMockResponse,
        latestMessage: {
          authorUserId: 1,
          messageId: 6,
          text: {
            text: "Sounds good",
          },
          time: {
            nanos: 0,
            seconds: 1577962000,
          },
        },
      });
    getGroupChatMessagesMock
      .mockImplementationOnce(getGroupChatMessages)
      .mockResolvedValue({
        lastMessageId: 6,
        messagesList: [
          {
            messageId: 6,
            authorUserId: 1,
            text: { text: "Sounds good" },
            time: { seconds: 1577962000, nanos: 0 },
          },
          ...messageData,
        ],
        noMore: true,
      });
    renderGroupChatView();
    await screen.findByRole("heading", { level: 1, name: "Test group chat" });

    await userEvent.type(screen.getByLabelText("Message"), "Sounds good");
    const sendButton = screen.getByRole("button", { name: t("global:send") });
    await userEvent.click(sendButton);
    await waitForElementToBeRemoved(
      within(sendButton).getByRole("progressbar")
    );

    expect(await screen.findByText("Sounds good")).toBeVisible();
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith(1, "Sounds good");
    expect(getGroupChatMock).toHaveBeenCalledTimes(2);
    expect(getGroupChatMessagesMock).toHaveBeenCalledTimes(2);
  });

  it("sends the message successfully via ctrl+enter combination", async () => {
    sendMessageMock.mockResolvedValue(new Empty());
    getGroupChatMock
      .mockResolvedValueOnce(baseGroupChatMockResponse)
      .mockResolvedValue({
        ...baseGroupChatMockResponse,
        latestMessage: {
          authorUserId: 1,
          messageId: 6,
          text: {
            text: "Sounds good",
          },
          time: {
            nanos: 0,
            seconds: 1577962000,
          },
        },
      });
    getGroupChatMessagesMock
      .mockImplementationOnce(getGroupChatMessages)
      .mockResolvedValue({
        lastMessageId: 6,
        messagesList: [
          {
            messageId: 6,
            authorUserId: 1,
            text: { text: "Sounds good" },
            time: { seconds: 1577962000, nanos: 0 },
          },
          ...messageData,
        ],
        noMore: true,
      });
    renderGroupChatView();
    await screen.findByRole("heading", { level: 1, name: "Test group chat" });

    await userEvent.type(screen.getByLabelText("Message"), "Sounds good");
    await userEvent.keyboard("{enter}");

    expect(sendMessageMock).toHaveBeenCalledTimes(0);

    await userEvent.keyboard("{ctrl>}{enter}{/ctrl}");

    expect(await screen.findByText("Sounds good")).toBeVisible();
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith(1, "Sounds good");
    expect(getGroupChatMock).toHaveBeenCalledTimes(2);
    expect(getGroupChatMessagesMock).toHaveBeenCalledTimes(2);
  });

  it("persists message draft state in sessionStorage", async () => {
    renderGroupChatView();
    await screen.findByRole("heading", { level: 1, name: "Test group chat" });
    await userEvent.type(screen.getByLabelText("Message"), "Not ready to se-");
    expect(sessionStorage.getItem("messages.1.1")).toEqual(
      JSON.stringify("Not ready to se-")
    );
  });

  it("populates message draft state from sessionStorage", async () => {
    sessionStorage.setItem("messages.1.1", JSON.stringify("Not ready to se-"));
    renderGroupChatView();
    await screen.findByRole("heading", { level: 1, name: "Test group chat" });
    expect(await screen.getByDisplayValue("Not ready to se-")).toBeVisible();
  });

  it("clears message draft state from sessionStorage", async () => {
    sessionStorage.setItem("messages.1.1", JSON.stringify("Not ready to se-"));
    renderGroupChatView();
    await screen.findByRole("heading", { level: 1, name: "Test group chat" });

    const sendButton = screen.getByRole("button", { name: t("global:send") });
    await userEvent.click(sendButton);
    await waitForElementToBeRemoved(
      within(sendButton).getByRole("progressbar")
    );

    expect(sessionStorage.getItem("messages.1.1")).toBeNull();
  });

  it("for a muted chat, shows it's muted and can unmute", async () => {
    getGroupChatMock.mockResolvedValue({
      ...baseGroupChatMockResponse,
      muteInfo: {
        muted: true,
        mutedUntil: Timestamp.fromDate(new Date(Date() + 10000)).toObject(),
      },
    });
    muteChatMock.mockResolvedValue(new Empty());
    renderGroupChatView();

    const muteIcon = await screen.findByTestId("mute-icon");
    expect(muteIcon).toBeVisible();

    getGroupChatMock.mockResolvedValue(baseGroupChatMockResponse);

    screen
      .getByRole("button", {
        name: t("messages:chat_view.actions_menu.a11y_label"),
      })
      .click();
    screen.getByText(t("messages:chat_view.mute.unmute_button_label")).click();

    await waitFor(() => {
      expect(muteChatMock).toBeCalledWith({ groupChatId: 1, unmute: true });
      expect(muteIcon).not.toBeVisible();
    });
  });

  it("for an unmuted chat, can mute and then shows mute icon", async () => {
    getGroupChatMock.mockResolvedValue(baseGroupChatMockResponse);
    muteChatMock.mockResolvedValue(new Empty());
    renderGroupChatView();

    getGroupChatMock.mockResolvedValue({
      ...baseGroupChatMockResponse,
      muteInfo: {
        muted: true,
        mutedUntil: Timestamp.fromDate(new Date(Date() + 10000)).toObject(),
      },
    });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));
    screen
      .getByRole("button", {
        name: t("messages:chat_view.actions_menu.a11y_label"),
      })
      .click();
    screen.getByText(t("messages:chat_view.mute.button_label")).click();
    within(screen.getByRole("dialog"))
      .getByLabelText(t("messages:chat_view.mute.forever_label"))
      .click();
    within(screen.getByRole("dialog"))
      .getByRole("button", { name: t("messages:chat_view.mute.button_label") })
      .click();

    await waitFor(() => {
      expect(muteChatMock).toBeCalledWith({ groupChatId: 1, forever: true });
    });
    const muteIcon = await screen.findByTestId("mute-icon");
    expect(muteIcon).toBeVisible();
  });

  it("shows an error if muting fails", async () => {
    mockConsoleError();
    getGroupChatMock.mockResolvedValue(baseGroupChatMockResponse);
    muteChatMock.mockRejectedValue(Error("Can't mute"));
    renderGroupChatView();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));
    screen
      .getByRole("button", {
        name: t("messages:chat_view.actions_menu.a11y_label"),
      })
      .click();
    screen.getByText(t("messages:chat_view.mute.button_label")).click();
    within(screen.getByRole("dialog"))
      .getByLabelText(t("messages:chat_view.mute.forever_label"))
      .click();
    within(screen.getByRole("dialog"))
      .getByRole("button", { name: t("messages:chat_view.mute.button_label") })
      .click();

    await assertErrorAlert("Can't mute");
  });
});
