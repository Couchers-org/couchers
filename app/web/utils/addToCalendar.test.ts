import { addToCalendar } from "./addToCalendar";

describe("addToCalendar", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete window.ReactNativeWebView;
  });

  it("fetches the URL and clicks a blob download link with the given filename outside the native app", async () => {
    const mockBlob = new Blob(["file contents"]);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: jest.fn().mockResolvedValue(mockBlob) });
    const createObjectURLSpy = jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    const revokeObjectURLSpy = jest.fn();
    URL.revokeObjectURL = revokeObjectURLSpy;
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.href).toBe("blob:mock-url");
      expect(this.download).toBe("file.ics");
    });

    await addToCalendar("https://example.com/calendar", "file.ics");

    expect(global.fetch).toHaveBeenCalledWith("https://example.com/calendar", { credentials: "include" });
    expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });

  it("throws when the fetch response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });

    await expect(addToCalendar("https://example.com/calendar", "file.ics")).rejects.toThrow(
      "Failed to fetch calendar file: 401",
    );
  });

  it("hands the base64-encoded file and filename to the native app when embedded natively", async () => {
    const postMessageSpy = jest.fn();
    window.ReactNativeWebView = {
      injectedObjectJson: () => JSON.stringify({ isNativeEmbed: true }),
      postMessage: postMessageSpy,
    };
    const mockBlob = new Blob(["ics content"]);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: jest.fn().mockResolvedValue(mockBlob) });
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click");

    await addToCalendar("https://example.com/calendar", "file.ics");

    expect(postMessageSpy).toHaveBeenCalledWith(
      JSON.stringify({
        type: "ADD_TO_CALENDAR",
        data: { ics_base64: Buffer.from("ics content").toString("base64"), filename: "file.ics" },
      }),
    );
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
