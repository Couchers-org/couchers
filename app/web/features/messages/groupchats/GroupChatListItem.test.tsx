import { render, screen } from "@testing-library/react";
import GroupChatListItem from "features/messages/groupchats/GroupChatListItem";
import { GroupChat } from "proto/conversations_pb";
import { service } from "service";
import groupChat from "test/fixtures/groupChat.json";
import wrapper from "test/hookWrapper";
import { getLiteUsers } from "test/serviceMockDefaults";
import { addDefaultUser } from "test/utils";

const getLiteUsersMock = service.user.getLiteUsers as jest.Mock;

beforeEach(() => {
  addDefaultUser(1);
  getLiteUsersMock.mockImplementation(getLiteUsers);
});

afterEach(() => jest.restoreAllMocks());

describe("GroupChatListItem avatar", () => {
  it("shows a group icon for non-DM group chats", async () => {
    render(<GroupChatListItem groupChat={groupChat} />, { wrapper });

    expect(await screen.findByTestId("GroupsIcon")).toBeVisible();
    expect(screen.queryByText("FD")).not.toBeInTheDocument();
  });

  it("shows the other member's avatar for DMs", async () => {
    const dmGroupChat: GroupChat.AsObject = {
      ...groupChat,
      isDm: true,
      latestMessage: {
        ...groupChat.latestMessage!,
        authorUserId: 2,
        text: { text: "Reply" },
      },
    };

    render(<GroupChatListItem groupChat={dmGroupChat} />, { wrapper });

    expect(await screen.findByText("FD")).toBeVisible();
    expect(screen.queryByTestId("GroupsIcon")).not.toBeInTheDocument();
  });

  it("shows the other member's avatar for DMs even when current user sent the latest message", async () => {
    const dmGroupChat: GroupChat.AsObject = {
      ...groupChat,
      isDm: true,
      latestMessage: {
        ...groupChat.latestMessage!,
        authorUserId: 1,
        text: { text: "Hello there" },
      },
    };

    render(<GroupChatListItem groupChat={dmGroupChat} />, { wrapper });

    expect(await screen.findByText("FD")).toBeVisible();
    expect(screen.queryByTestId("GroupsIcon")).not.toBeInTheDocument();
  });
});
