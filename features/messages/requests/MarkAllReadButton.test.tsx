import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MARK_ALL_READ } from "features/messages/constants";
import MarkAllReadButton from "features/messages/requests/MarkAllReadButton";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { GroupChat } from "proto/conversations_pb";
import { HostRequest } from "proto/requests_pb";
import { service } from "service";
import chat from "test/fixtures/groupChat.json";
import request from "test/fixtures/hostRequest.json";
import messages from "test/fixtures/messages.json";
import wrapper from "test/hookWrapper";
import { assertErrorAlert, mockConsoleError } from "test/utils";

const listGroupChatsMock = service.conversations
  .listGroupChats as jest.MockedFunction<
  typeof service.conversations.listGroupChats
>;
const listHostRequestsMock = service.requests
  .listHostRequests as jest.MockedFunction<
  typeof service.requests.listHostRequests
>;
const markLastRequestSeenMock = service.requests
  .markLastRequestSeen as jest.MockedFunction<
  typeof service.requests.markLastRequestSeen
>;
const markLastSeenGroupChatMock = service.conversations
  .markLastSeenGroupChat as jest.MockedFunction<
  typeof service.conversations.markLastSeenGroupChat
>;

describe("MarkAllReadButton", () => {
  const mutableStore: {
    chats: GroupChat.AsObject[];
    requests: HostRequest.AsObject[];
  } = {
    chats: [],
    requests: [],
  };
  beforeEach(() => {
    mutableStore.chats = [...defaultChats];
    mutableStore.requests = [...defaultRequests];
    //naive implementations rely on id = array index + 1
    listGroupChatsMock.mockImplementation(
      async (lastMessageId = 0, number = 1) => {
        const chats = [
          ...mutableStore.chats.slice(lastMessageId, lastMessageId + number),
        ];
        return {
          groupChatsList: chats,
          lastMessageId: chats[chats.length - 1].latestMessage!.messageId,
          noMore: lastMessageId + 1 === mutableStore.chats.length,
        };
      }
    );
    listHostRequestsMock.mockImplementation(
      async ({ lastRequestId = 0, count = 1 }) => {
        const requests = [
          ...mutableStore.requests.slice(lastRequestId, lastRequestId + count),
        ];
        return {
          hostRequestsList: requests,
          lastRequestId: requests[requests.length - 1].latestMessage!.messageId,
          noMore: lastRequestId + 1 === mutableStore.requests.length,
        };
      }
    );
    markLastRequestSeenMock.mockImplementation(
      async (hostRequestId, messageId) => {
        mutableStore.requests[hostRequestId - 1].lastSeenMessageId = messageId;
        return new Empty();
      }
    );
    markLastSeenGroupChatMock.mockImplementation(async (chatId, messageId) => {
      mutableStore.chats[chatId - 1].lastSeenMessageId = messageId;
      return new Empty();
    });
  });

  it("marks expected chats", async () => {
    render(<MarkAllReadButton type="chats" />, { wrapper });
    userEvent.click(screen.getByRole("button", { name: MARK_ALL_READ }));

    await waitFor(() => {
      expect(markLastSeenGroupChatMock).toBeCalledTimes(1);
      expect(markLastSeenGroupChatMock).toBeCalledWith(2, 2);
      expect(mutableStore).toMatchObject({
        chats: [
          { lastSeenMessageId: 1 },
          { lastSeenMessageId: 2 },
          { lastSeenMessageId: 4 },
        ],
      });
    });
  });
  it("marks expected requests", async () => {
    render(<MarkAllReadButton type="hosting" />, { wrapper });
    userEvent.click(screen.getByRole("button", { name: MARK_ALL_READ }));

    await waitFor(() => {
      expect(markLastRequestSeenMock).toBeCalledTimes(1);
      expect(markLastRequestSeenMock).toBeCalledWith(2, 2);
      expect(mutableStore).toMatchObject({
        requests: [
          { lastSeenMessageId: 1 },
          { lastSeenMessageId: 2 },
          { lastSeenMessageId: 4 },
        ],
      });
    });
  });

  it("gives an error alert", async () => {
    mockConsoleError();
    listGroupChatsMock.mockRejectedValueOnce(new Error("Generic error"));
    render(<MarkAllReadButton type="chats" />, { wrapper });
    userEvent.click(screen.getByRole("button", { name: MARK_ALL_READ }));

    await assertErrorAlert("Generic error");
  });
});

//id must = array index + 1
const defaultChats: GroupChat.AsObject[] = [
  {
    ...chat,
    groupChatId: 1,
    lastSeenMessageId: 1,
    latestMessage: { ...messages[0], messageId: 1 },
  },
  {
    ...chat,
    groupChatId: 2,
    lastSeenMessageId: 1,
    latestMessage: { ...messages[0], messageId: 2 },
  },
  {
    ...chat,
    groupChatId: 3,
    lastSeenMessageId: 4,
    latestMessage: { ...messages[0], messageId: 3 },
  },
];

const defaultRequests: HostRequest.AsObject[] = [
  {
    ...request,
    hostRequestId: 1,
    lastSeenMessageId: 1,
    latestMessage: { ...messages[0], messageId: 1 },
  },
  {
    ...request,
    hostRequestId: 2,
    lastSeenMessageId: 1,
    latestMessage: { ...messages[0], messageId: 2 },
  },
  {
    ...request,
    hostRequestId: 3,
    lastSeenMessageId: 4,
    latestMessage: { ...messages[0], messageId: 3 },
  },
];
