import { render, screen, within } from "@testing-library/react";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React from "react";
import {
  mockAllIsIntersecting,
  mockIsIntersecting,
} from "react-intersection-observer/test-utils";
import { Route } from "react-router-dom";
import { messagesRoute } from "../../../AppRoutes";
import { service } from "../../../service";
import messageData from "../../../test/fixtures/messages.json";
import { getHookWrapperWithClient } from "../../../test/hookWrapper";
import {
  getGroupChatMessages,
  getUser,
} from "../../../test/serviceMockDefaults";
import { addDefaultUser, MockedService, wait } from "../../../test/utils";
import { MARK_LAST_SEEN_TIMEOUT } from "../constants";
import GroupChatView from "./GroupChatView";

const getGroupChatMock = service.conversations.getGroupChat as MockedService<
  typeof service.conversations.getGroupChat
>;
const getUserMock = service.user.getUser as jest.Mock;

const getGroupChatMessagesMock = service.conversations
  .getGroupChatMessages as MockedService<
  typeof service.conversations.getGroupChatMessages
>;
const baseGroupChatMockResponse = {
  groupChatId: 1,
  title: "Test group chat",
  memberUserIdsList: [1, 2, 3],
  adminUserIdsList: [1],
  onlyAdminsInvite: false,
  isDm: false,
  unseenMessageCount: 4,
  lastSeenMessageId: 1,
  latestMessage: {
    messageId: 5,
    authorUserId: 3,
    text: { text: "In 2 hours?" },
    time: { seconds: 1577900000, nanos: 0 },
  },
};

const markLastSeenGroupChatMock = service.conversations
  .markLastSeenGroupChat as MockedService<
  typeof service.conversations.markLastSeenGroupChat
>;

// TODO: tests involving these mutations - maybe these can be localised only
// in test blocks that need them
const sendMessageMock = service.conversations.sendMessage as MockedService<
  typeof service.conversations.sendMessage
>;
const leaveGroupChatMock = service.conversations
  .leaveGroupChat as MockedService<typeof service.conversations.leaveGroupChat>;

beforeEach(() => {
  addDefaultUser();
});

function renderGroupChatView() {
  const { client, wrapper } = getHookWrapperWithClient({
    initialEntries: [`${messagesRoute}/groupchats/1`],
  });
  render(
    <Route path={`${messagesRoute}/groupchats/:groupChatId`}>
      <GroupChatView />
    </Route>,
    { wrapper }
  );

  return client;
}

describe("GroupChatView", () => {
  beforeEach(() => {
    getGroupChatMock.mockResolvedValue(baseGroupChatMockResponse);
    getGroupChatMessagesMock.mockImplementation(getGroupChatMessages);
    getUserMock.mockImplementation(getUser);
    markLastSeenGroupChatMock.mockResolvedValue(new Empty());
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
        expect(messageElement.getByText("You created the chat")).toBeVisible();
      }
    }
  });

  it("should mark the message seen with the latest message if they are all visible", async () => {
    renderGroupChatView();
    // For React Query queries to resolve
    await wait(0);

    mockAllIsIntersecting(true);
    await wait(MARK_LAST_SEEN_TIMEOUT + 1);

    expect(markLastSeenGroupChatMock).toHaveBeenCalledTimes(1);
    // (groupChatId, messageId)
    expect(markLastSeenGroupChatMock).toHaveBeenCalledWith(1, 5);
  });

  it("should only mark the latest visible message if only some are visible", async () => {
    renderGroupChatView();
    // For React Query queries to resolve
    await wait(0);

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
      unseenMessageCount: 0,
      lastSeenMessageId: 5,
    });
    renderGroupChatView();
    // For React Query queries to resolve
    await wait(0);

    mockAllIsIntersecting(true);
    await wait(MARK_LAST_SEEN_TIMEOUT + 1);

    expect(markLastSeenGroupChatMock).not.toHaveBeenCalled();
  });
});
