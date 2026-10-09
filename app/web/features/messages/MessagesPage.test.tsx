import { act, render, screen } from "@testing-library/react";
import { MARK_LAST_SEEN_TIMEOUT } from "features/messages/constants";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import mockRouter from "next-router-mock";
import MessagesPage from "pages/messages/[[...slug]]";
import { mockAllIsIntersecting } from "react-intersection-observer/test-utils";
import { service } from "service";
import messageData from "test/fixtures/messages.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getLiteUser, getLiteUsers, getUser } from "test/serviceMockDefaults";
import { addDefaultUser, MockedService, wait } from "test/utils";

const getGroupChatMock = service.conversations.getGroupChat as MockedService<typeof service.conversations.getGroupChat>;
const getGroupChatMessagesMock = service.conversations.getGroupChatMessages as MockedService<
  typeof service.conversations.getGroupChatMessages
>;
const markLastSeenGroupChatMock = service.conversations.markLastSeenGroupChat as MockedService<
  typeof service.conversations.markLastSeenGroupChat
>;
const listFriendsMock = service.api.listFriends as MockedService<typeof service.api.listFriends>;

// message ids are global, so chat 1's messages (11-15) are all newer than chat 2's (1-5)
const idOffset = (chatId: number) => (chatId === 1 ? 10 : 0);

function groupChat(chatId: number) {
  return {
    adminUserIdsList: [1],
    groupChatId: chatId,
    isDm: false,
    lastSeenMessageId: 0,
    latestMessage: { ...messageData[0], messageId: messageData[0].messageId + idOffset(chatId) },
    memberUserIdsList: [1, 2, 3],
    onlyAdminsInvite: false,
    title: `Chat ${chatId}`,
    unseenMessageCount: messageData.length,
    muteInfo: { muted: false, mutedUntil: undefined },
    canMessage: true,
    isArchived: false,
  };
}

// next-router-mock doesn't parse dynamic routes, so pass the catch-all slug explicitly
const goToChat = (chatId: number) =>
  act(() => mockRouter.push({ pathname: "/messages/[[...slug]]", query: { slug: ["chats", `${chatId}`] } }));

describe("MessagesPage", () => {
  beforeEach(() => {
    addDefaultUser();
    getGroupChatMock.mockImplementation(async (chatId) => groupChat(chatId));
    getGroupChatMessagesMock.mockImplementation(async (chatId) => ({
      lastMessageId: 1 + idOffset(chatId),
      messagesList: messageData.map((m) => ({ ...m, messageId: m.messageId + idOffset(chatId) })),
      noMore: true,
    }));
    (service.user.getLiteUser as jest.Mock).mockImplementation(getLiteUser);
    (service.user.getLiteUsers as jest.Mock).mockImplementation(getLiteUsers);
    (service.user.getUser as jest.Mock).mockImplementation(getUser);
    markLastSeenGroupChatMock.mockResolvedValue(new Empty());
    listFriendsMock.mockResolvedValue([1, 2]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("marks messages seen in the right chat when switching chats", async () => {
    const { wrapper } = getHookWrapperWithClient();
    await goToChat(1);
    const { rerender } = render(<MessagesPage />, { wrapper });
    await screen.findByText("Chat 1");

    // read chat 1, then switch before the debounced mark-seen fires
    mockAllIsIntersecting(true);
    await goToChat(2);
    rerender(<MessagesPage />);
    await screen.findByText("Chat 2");

    // the pending mark lands on chat 1, not chat 2
    expect(markLastSeenGroupChatMock).toHaveBeenCalledWith(1, 15);

    // chat 2's messages are older than anything seen in chat 1, but still get marked
    mockAllIsIntersecting(true);
    await wait(MARK_LAST_SEEN_TIMEOUT + 1);

    expect(markLastSeenGroupChatMock).toHaveBeenCalledWith(2, 5);
    expect(markLastSeenGroupChatMock).toHaveBeenCalledTimes(2);
  });
});
