import groupChat from "test/fixtures/groupChat.json";
import hostRequest from "test/fixtures/hostRequest.json";

import { hasUnreadMessages } from "./utils";

describe("hasUnreadMessages", () => {
  it("returns false when latestMessage is undefined", () => {
    expect(hasUnreadMessages({ ...groupChat, latestMessage: undefined })).toBe(
      false,
    );
  });

  it("returns false when lastSeenMessageId equals latestMessage.messageId", () => {
    expect(
      hasUnreadMessages({
        ...groupChat,
        lastSeenMessageId: groupChat.latestMessage!.messageId,
      }),
    ).toBe(false);
  });

  it("returns true when lastSeenMessageId is behind latestMessage.messageId", () => {
    expect(
      hasUnreadMessages({
        ...groupChat,
        lastSeenMessageId: groupChat.latestMessage!.messageId - 1,
      }),
    ).toBe(true);
  });

  it("works for host requests", () => {
    expect(hasUnreadMessages(hostRequest)).toBe(true);
    expect(
      hasUnreadMessages({
        ...hostRequest,
        lastSeenMessageId: hostRequest.latestMessage!.messageId,
      }),
    ).toBe(false);
  });
});
