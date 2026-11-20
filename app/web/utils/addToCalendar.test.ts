import { renderHook } from "@testing-library/react";
import { Event } from "proto/events_pb";
import events from "test/fixtures/events.json";

import { useAddToCalendar } from "./addToCalendar";

const event = events[0] as Event.AsObject;

function addToCalendar(event: Event.AsObject) {
  const { result } = renderHook(() => useAddToCalendar());
  return result.current(event);
}

describe("useAddToCalendar", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete window.ReactNativeWebView;
  });

  it("fetches the event's calendar file and clicks a blob download link outside the native app", async () => {
    const mockBlob = new Blob(["file contents"]);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: jest.fn().mockResolvedValue(mockBlob) });
    const createObjectURLSpy = jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    const revokeObjectURLSpy = jest.fn();
    URL.revokeObjectURL = revokeObjectURLSpy;
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.href).toBe("blob:mock-url");
      expect(this.download).toBe("weekly-meetup.ics");
    });

    await addToCalendar(event);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`/events/${event.eventId}/calendar`), {
      credentials: "include",
    });
    expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });

  it("throws when the fetch response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });

    await expect(addToCalendar(event)).rejects.toThrow("Failed to fetch calendar file: 401");
  });

  it("asks the native app to add the event instead of downloading", async () => {
    const postMessage = jest.fn();
    window.ReactNativeWebView = {
      injectedObjectJson: () => JSON.stringify({ isNativeEmbed: true, capabilities: ["addToCalendar"] }),
      postMessage,
    };
    global.fetch = jest.fn();

    await addToCalendar(event);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(JSON.parse(postMessage.mock.calls[0][0])).toEqual({
      type: "REQUEST_ADD_TO_CALENDAR",
      data: {
        title: "Weekly Meetup",
        startDate: "2021-06-29T02:37:00Z",
        endDate: "2021-06-29T03:37:00Z",
        timeZone: "Etc/GMT-2",
        location: "Concertgebouw",
        url: `${window.location.origin}/event/1/weekly-meetup`,
        notes: `Be there or be square!\n\n${window.location.origin}/event/1/weekly-meetup`,
      },
    });
  });
});
