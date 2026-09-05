import groupChat from "test/fixtures/groupChat.json";
import hostRequest from "test/fixtures/hostRequest";

import { hasUnreadMessages } from "./utils";

describe("hasUnreadMessages", () => {
  it("returns false when latestMessage is undefined", () => {
    expect(hasUnreadMessages({ ...groupChat, latestMessage: undefined })).toBe(false);
  });

  it("returns false when the server reports no unseen messages", () => {
    expect(hasUnreadMessages({ ...groupChat, unseenMessageCount: 0 })).toBe(false);
  });

  it("returns true when the server reports unseen messages", () => {
    expect(hasUnreadMessages({ ...groupChat, unseenMessageCount: 1 })).toBe(true);
  });

  // The server excludes messages sent while the user was out of the chat, so a latestMessage newer
  // than lastSeenMessageId is not unread on its own.
  it("trusts the server count over the message ids", () => {
    expect(
      hasUnreadMessages({
        ...groupChat,
        lastSeenMessageId: 0,
        unseenMessageCount: 0,
      }),
    ).toBe(false);
  });

  it("works for host requests", () => {
    expect(hasUnreadMessages(hostRequest)).toBe(true);
    expect(hasUnreadMessages({ ...hostRequest, unseenMessageCount: 0 })).toBe(false);
  });
});
