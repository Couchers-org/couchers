import { downloadAtURL } from "./download";

describe("downloadAtURL", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete window.ReactNativeWebView;
  });

  it("clicks a download link with the given URL and filename outside the native app", () => {
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.href).toBe("https://example.com/download");
      expect(this.download).toBe("file.data");
      expect(this.target).toBe("_blank");
    });

    downloadAtURL("https://example.com/download", "file.data");

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("hands the URL to the native app instead of clicking a link when embedded natively", () => {
    const postMessageSpy = jest.fn();
    window.ReactNativeWebView = {
      injectedObjectJson: () => JSON.stringify({ isNativeEmbed: true }),
      postMessage: postMessageSpy,
    };
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click");

    downloadAtURL("https://example.com/download", "file.data");

    expect(postMessageSpy).toHaveBeenCalledWith(
      JSON.stringify({
        type: "OPEN_EXTERNAL_URL",
        data: { url: "https://example.com/download" },
      }),
    );
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
