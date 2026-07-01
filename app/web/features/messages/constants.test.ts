import { messageFilterToRequest } from "features/messages/constants";
import { MessageThreadFilter } from "proto/conversations_pb";

describe("messageFilterToRequest", () => {
  it("maps content filters to the matching enum with onlyArchived=false", () => {
    expect(messageFilterToRequest("all")).toEqual({
      filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_ALL,
      onlyArchived: false,
    });
    expect(messageFilterToRequest("unread")).toEqual({
      filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_UNREAD,
      onlyArchived: false,
    });
    expect(messageFilterToRequest("chats")).toEqual({
      filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_CHATS,
      onlyArchived: false,
    });
    expect(messageFilterToRequest("hosting")).toEqual({
      filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_HOSTING,
      onlyArchived: false,
    });
    expect(messageFilterToRequest("surfing")).toEqual({
      filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_SURFING,
      onlyArchived: false,
    });
    expect(messageFilterToRequest("public-trips")).toEqual({
      filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_PUBLIC_TRIPS,
      onlyArchived: false,
    });
  });

  it("maps archived to the full list restricted to archived threads", () => {
    expect(messageFilterToRequest("archived")).toEqual({
      filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_ALL,
      onlyArchived: true,
    });
  });
});
