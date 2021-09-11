import {
  act,
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SEND } from "features/constants";
import { MARK_LAST_SEEN_TIMEOUT } from "features/messages/constants";
import ChatView from "features/messages/chats/ChatView";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import {
  mockAllIsIntersecting,
  mockIsIntersecting,
} from "react-intersection-observer/test-utils";
import { Route } from "react-router-dom";
import { messagesRoute } from "routes";
import { service } from "service";
import messageData from "test/fixtures/messages.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getChatMessages, getUser } from "test/serviceMockDefaults";
import { addDefaultUser, MockedService, wait } from "test/utils";

import { CHAT_REFETCH_INTERVAL } from "./constants";

const getChatMock = service.conversations.getChat as MockedService<
  typeof service.conversations.getChat
>;
const getUserMock = service.user.getUser as jest.Mock;
const listFriendsMock = service.api.listFriends as MockedService<
  typeof service.api.listFriends
>;

const getChatMessagesMock = service.conversations
  .getChatMessages as MockedService<
  typeof service.conversations.getChatMessages
>;
const baseChatMockResponse = {
  adminUserIdsList: [1],
  chatId: 1,
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
};

const markLastSeenChatMock = service.conversations
  .markLastSeenChat as MockedService<
  typeof service.conversations.markLastSeenChat
>;

// TODO: tests involving these mutations - maybe these can be localised only
// in test blocks that need them
const sendMessageMock = service.conversations.sendMessage as MockedService<
  typeof service.conversations.sendMessage
>;
// const leaveChatMock = service.conversations
//   .leaveChat as MockedService<typeof service.conversations.leaveChat>;

beforeEach(() => {
  addDefaultUser();
});

function renderChatView() {
  const { client, wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [`${messagesRoute}/chats/1`],
  });
  render(
    <Route path={`${messagesRoute}/chats/:chatId`}>
      <ChatView />
    </Route>,
    { wrapper }
  );

  return client;
}

describe("ChatView", () => {
  beforeEach(() => {
    getChatMock.mockResolvedValue(baseChatMockResponse);
    getChatMessagesMock.mockImplementation(getChatMessages);
    getUserMock.mockImplementation(getUser);
    markLastSeenChatMock.mockResolvedValue(new Empty());
    listFriendsMock.mockResolvedValue([1, 2]);
  });

  it("renders the chat correctly", async () => {
    renderChatView();

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
        expect(messageElement.getByText("You created the chat")).toBeVisible();
      }
    }
    expect(getChatMock).toHaveBeenCalledTimes(1);
    // 1 is chatId here
    expect(getChatMock).toHaveBeenCalledWith(1);
    expect(getChatMessagesMock).toHaveBeenCalledTimes(1);
    expect(getChatMessagesMock).toHaveBeenCalledWith(1, undefined);
  });

  describe("when there are new messages due to come in", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("shows the new messages", async () => {
      getChatMock
        .mockResolvedValueOnce(baseChatMockResponse)
        .mockResolvedValue({
          ...baseChatMockResponse,
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
      getChatMessagesMock
        .mockImplementationOnce(getChatMessages)
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
      renderChatView();

      act(() => {
        jest.runOnlyPendingTimers();
      });

      let messages = await screen.findAllByTestId(/message-\d/);
      expect(messages).toHaveLength(5);
      expect(getChatMock).toHaveBeenCalledTimes(1);
      expect(getChatMessagesMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(CHAT_REFETCH_INTERVAL);
      });

      messages = screen.getAllByTestId(/message-\d/);
      expect(messages).toHaveLength(6);
      expect(within(messages[0]).getByText("Sounds good")).toBeVisible();
      expect(getChatMock).toHaveBeenCalledTimes(2);
      expect(getChatMock.mock.calls).toEqual([[1], [1]]);
      expect(getChatMessagesMock).toHaveBeenCalledTimes(2);
      expect(getChatMessagesMock.mock.calls).toEqual([
        [1, undefined],
        [1, undefined],
      ]);
    });
  });

  it("should mark the message seen with the latest message if they are all visible", async () => {
    renderChatView();
    // For React Query queries to resolve
    await wait(0);

    mockAllIsIntersecting(true);
    await wait(MARK_LAST_SEEN_TIMEOUT + 1);

    expect(markLastSeenChatMock).toHaveBeenCalledTimes(1);
    // (chatId, messageId)
    expect(markLastSeenChatMock).toHaveBeenCalledWith(1, 5);
  });

  it("should only mark the latest visible message if only some are visible", async () => {
    renderChatView();
    // For React Query queries to resolve
    await wait(0);

    // Only message 1, 2 and 3 are visible
    const visibleMessages = screen.getAllByTestId(/message-[123]/);
    visibleMessages.forEach((message) => {
      mockIsIntersecting(message, true);
    });
    await wait(MARK_LAST_SEEN_TIMEOUT + 1);

    expect(markLastSeenChatMock).toHaveBeenCalledTimes(1);
    expect(markLastSeenChatMock).toHaveBeenCalledWith(1, 3);
  });

  it("should not try to mark any message as seen if they have all been seen", async () => {
    getChatMock.mockResolvedValue({
      ...baseChatMockResponse,
      lastSeenMessageId: 5,
      unseenMessageCount: 0,
    });
    renderChatView();
    // For React Query queries to resolve
    await wait(0);

    mockAllIsIntersecting(true);
    await wait(MARK_LAST_SEEN_TIMEOUT + 1);

    expect(markLastSeenChatMock).not.toHaveBeenCalled();
  });

  it("sends the message successfully and shows it in the chat", async () => {
    sendMessageMock.mockResolvedValue(new Empty());
    getChatMock.mockResolvedValueOnce(baseChatMockResponse).mockResolvedValue({
      ...baseChatMockResponse,
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
    getChatMessagesMock
      .mockImplementationOnce(getChatMessages)
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
    renderChatView();
    await screen.findByRole("heading", { level: 1, name: "Test group chat" });

    userEvent.type(screen.getByLabelText("Message"), "Sounds good");
    const sendButton = screen.getByRole("button", { name: SEND });
    userEvent.click(sendButton);
    await waitForElementToBeRemoved(
      within(sendButton).getByRole("progressbar")
    );

    expect(await screen.findByText("Sounds good")).toBeVisible();
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith(1, "Sounds good");
    expect(getChatMock).toHaveBeenCalledTimes(2);
    expect(getChatMessagesMock).toHaveBeenCalledTimes(2);
  });
});
