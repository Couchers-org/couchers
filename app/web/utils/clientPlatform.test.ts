import { getClientPlatform } from "./clientPlatform";

const IOS_WEBVIEW_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 CouchersNative/1.3.0 (ios; build 81; v1.2.18410.1156180a.20260528Z0533)";
const ANDROID_WEBVIEW_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 CouchersNative/1.3.0 (android; build 81; v1.2.18410.1156180a.20260528Z0533)";
const MOBILE_BROWSER_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1";

const originalUserAgent = navigator.userAgent;

function setUserAgent(userAgent: string) {
  Object.defineProperty(navigator, "userAgent", {
    value: userAgent,
    configurable: true,
  });
}

function setMobileViewport(matches: boolean) {
  window.matchMedia = jest.fn().mockReturnValue({ matches }) as never;
}

afterEach(() => {
  setUserAgent(originalUserAgent);
});

describe("getClientPlatform", () => {
  it("reports app_ios inside the iOS app's web view", () => {
    setUserAgent(IOS_WEBVIEW_USER_AGENT);
    setMobileViewport(true);
    expect(getClientPlatform()).toBe("app_ios");
  });

  it("reports app_android inside the Android app's web view", () => {
    setUserAgent(ANDROID_WEBVIEW_USER_AGENT);
    setMobileViewport(true);
    expect(getClientPlatform()).toBe("app_android");
  });

  it("reports web_mobile in a mobile browser", () => {
    setUserAgent(MOBILE_BROWSER_USER_AGENT);
    setMobileViewport(true);
    expect(getClientPlatform()).toBe("web_mobile");
  });

  it("reports web_desktop on a desktop viewport", () => {
    setUserAgent(MOBILE_BROWSER_USER_AGENT);
    setMobileViewport(false);
    expect(getClientPlatform()).toBe("web_desktop");
  });
});
