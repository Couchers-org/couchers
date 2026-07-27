import { messageFilterToRequest } from "features/messages/constants";
import { MessageThreadCategory } from "proto/conversations_pb";

describe("messageFilterToRequest", () => {
  it("maps content filters to the matching categories with onlyUnread/onlyArchived=false", () => {
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

  it("maps unread to the full list restricted to unread threads", () => {
    expect(messageFilterToRequest("unread")).toEqual({
      categories: [],
      onlyUnread: true,
      onlyArchived: false,
    });
  });

  it("maps archived to the full list restricted to archived threads", () => {
    expect(messageFilterToRequest("archived")).toEqual({
      categories: [],
      onlyUnread: false,
      onlyArchived: true,
    });
  });
});
