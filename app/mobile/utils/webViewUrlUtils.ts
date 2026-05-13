import { privacyPolicyRoute, tosRoute } from "../routes";

/**
 * Determines whether a URL should load inside the WebView or be opened externally
 * @param url - The URL to check
 * @param webBaseUrl - The base URL of the web app
 * @returns true if URL should load in WebView, false if it should open externally
 */
export function shouldLoadInWebView(url: string, webBaseUrl: string): boolean {
  // Exceptions - these should open in external browser
  if (url.includes(tosRoute) || url.includes(privacyPolicyRoute)) {
    return false;
  }

  // Help center should always open in external browser
  if (url.includes("help.couchers.org")) {
    return false;
  }

  // Internal app URLs
  if (url.startsWith(webBaseUrl)) {
    return true;
  }

  // External protocol URLs that the OS should handle, not the WebView
  if (url.startsWith("mailto:") || url.startsWith("tel:")) {
    return false;
  }

  // Special browser URLs (about:blank, data:, blob:, javascript:)
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return true;
  }

  // reCAPTCHA (needed for form protection)
  if (
    url.includes("google.com/recaptcha") ||
    url.includes("gstatic.com/recaptcha")
  ) {
    return true;
  }

  return false;
}
