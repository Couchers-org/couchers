import { privacyPolicyRoute, tosRoute } from "../routes";

// Schemes that may load inside the WebView besides http(s) (iframes, object URLs)
const IN_WEBVIEW_SCHEMES = ["about", "blob"];

// Schemes that must never be loaded or handed off to the OS
const UNSAFE_SCHEMES = ["javascript", "data", "file", "vbscript"];

function getScheme(url: string): string | null {
  const match = /^\s*([a-z][a-z0-9+.-]*):/i.exec(url);
  return match ? match[1].toLowerCase() : null;
}

function isInternalUrl(url: string, webBaseUrl: string): boolean {
  if (!url.startsWith(webBaseUrl)) {
    return false;
  }
  // Require a boundary so e.g. https://couchers.org.evil.com doesn't match
  const next = url.charAt(webBaseUrl.length);
  return next === "" || next === "/" || next === "?" || next === "#";
}

/**
 * Whether a URL must be neither loaded in the WebView nor opened externally
 */
export function isUnsafeUrl(url: string): boolean {
  const scheme = getScheme(url);
  return scheme !== null && UNSAFE_SCHEMES.includes(scheme);
}

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
  if (isInternalUrl(url, webBaseUrl)) {
    return true;
  }

  const scheme = getScheme(url);
  return scheme !== null && IN_WEBVIEW_SCHEMES.includes(scheme);
}
