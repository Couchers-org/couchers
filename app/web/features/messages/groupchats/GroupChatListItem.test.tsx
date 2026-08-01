import { render, screen } from "@testing-library/react";
import { GroupChat } from "couchers/proto/conversations_pb";
import GroupChatListItem from "features/messages/groupchats/GroupChatListItem";
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

it("shows a group icon for non-DM group chats", async () => {
  render(<GroupChatListItem groupChat={groupChat} />, { wrapper });

  expect(await screen.findByTestId("GroupsIcon")).toBeVisible();
  // Fixture's latest author is user 3 (Funny Kid) who has a photo — assert
  // their photo is not shown in a group chat row
  expect(screen.queryByAltText("Funny Kid")).not.toBeInTheDocument();
});

it("shows the other member's initials for DMs when they have no profile photo", async () => {
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

it("shows the other member's photo for DMs when they have a profile photo", async () => {
  const dmGroupChat: GroupChat.AsObject = {
    ...groupChat,
    memberUserIdsList: [1, 3],
    isDm: true,
    latestMessage: {
      ...groupChat.latestMessage!,
      authorUserId: 1,
      text: { text: "Hey!" },
    },
  };

  render(<GroupChatListItem groupChat={dmGroupChat} />, { wrapper });

  expect(await screen.findByAltText("Funny Kid")).toBeVisible();
  expect(screen.queryByTestId("GroupsIcon")).not.toBeInTheDocument();
});

it("shows a person icon fallback for DMs when the other member is unresolved", async () => {
  // User 999 is not in the mock getLiteUsers map, simulating a
  // deleted/banned/blocked user filtered out server-side
  const dmGroupChat: GroupChat.AsObject = {
    ...groupChat,
    memberUserIdsList: [1, 999],
    isDm: true,
    latestMessage: {
      ...groupChat.latestMessage!,
      authorUserId: 1,
      text: { text: "Hey!" },
    },
  };

  render(<GroupChatListItem groupChat={dmGroupChat} />, { wrapper });

  expect(await screen.findByTestId("PersonIcon")).toBeVisible();
  expect(screen.queryByTestId("GroupsIcon")).not.toBeInTheDocument();
});
