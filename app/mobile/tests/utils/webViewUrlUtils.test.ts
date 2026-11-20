import { isUnsafeUrl, shouldLoadInWebView } from "@/utils/webViewUrlUtils";

const base = "https://couchers.org";

describe("shouldLoadInWebView", () => {
  it.each([
    base,
    `${base}/dashboard`,
    `${base}?a=1`,
    `${base}#top`,
    "about:blank",
    "about:srcdoc",
    "blob:https://couchers.org/1234",
  ])("loads %s in the WebView", (url) => {
    expect(shouldLoadInWebView(url, base)).toBe(true);
  });

  it.each([
    "https://couchers.org.evil.com/login",
    "https://couchers.organic.com",
    "https://example.com",
    "https://help.couchers.org/hc/en-us",
    `${base}/terms`,
    "mailto:a@b.com",
    "tel:+123",
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
  ])("does not load %s in the WebView", (url) => {
    expect(shouldLoadInWebView(url, base)).toBe(false);
  });
});

describe("isUnsafeUrl", () => {
  it.each([
    "javascript:alert(1)",
    " JAVASCRIPT:alert(1)",
    "data:text/html,hi",
    "file:///etc/passwd",
    "vbscript:msgbox",
  ])("flags %s", (url) => {
    expect(isUnsafeUrl(url)).toBe(true);
  });

  it.each(["https://example.com", "mailto:a@b.com", "tel:+123", "about:blank"])(
    "allows %s",
    (url) => {
      expect(isUnsafeUrl(url)).toBe(false);
    },
  );
});
