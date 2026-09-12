import { messageFilterToRequest } from "features/messages/constants";
import { MessageThreadCategory } from "proto/conversations_pb";
import { messageTypeStrings } from "routes";

describe("messageFilterToRequest", () => {
  it("maps content filters to their category, unrestricted by read state and excluding archived", () => {
    expect(messageFilterToRequest("all")).toEqual({
      categories: [],
      onlyUnread: false,
      onlyArchived: false,
    });
    expect(messageFilterToRequest("chats")).toEqual({
      categories: [MessageThreadCategory.MESSAGE_THREAD_CATEGORY_CHATS],
      onlyUnread: false,
      onlyArchived: false,
    });
    expect(messageFilterToRequest("hosting")).toEqual({
      categories: [MessageThreadCategory.MESSAGE_THREAD_CATEGORY_HOSTING],
      onlyUnread: false,
      onlyArchived: false,
    });
    expect(messageFilterToRequest("surfing")).toEqual({
      categories: [MessageThreadCategory.MESSAGE_THREAD_CATEGORY_SURFING],
      onlyUnread: false,
      onlyArchived: false,
    });
    expect(messageFilterToRequest("public-trips")).toEqual({
      categories: [MessageThreadCategory.MESSAGE_THREAD_CATEGORY_MY_PUBLIC_TRIPS],
      onlyUnread: false,
      onlyArchived: false,
    });
  });

  it("maps unread to unread threads across all categories, excluding archived", () => {
    expect(messageFilterToRequest("unread")).toEqual({
      categories: [],
      onlyUnread: true,
      onlyArchived: false,
    });
  });

  it("maps archived to archived threads across all categories, regardless of read state", () => {
    expect(messageFilterToRequest("archived")).toEqual({
      categories: [],
      onlyUnread: false,
      onlyArchived: true,
    });
  });

  // Archived is its own tab, so every other filter deliberately leaves archived threads out.
  it("includes archived threads only under the archived filter", () => {
    for (const filter of messageTypeStrings) {
      expect(messageFilterToRequest(filter).onlyArchived).toBe(filter === "archived");
    }
  });
});
