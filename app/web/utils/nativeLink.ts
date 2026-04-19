import { useCallback, useSyncExternalStore } from "react";

function getReactNativeWebView(): typeof window.ReactNativeWebView {
  if (typeof window !== "undefined" && window.ReactNativeWebView) {
    return window.ReactNativeWebView;
  }
}

function isNativeEmbed(): boolean {
  const webview = getReactNativeWebView();
  if (!webview) return false;

  // Android-reliable detection: Check injectedObjectJson() which is more reliable than
  // just checking for ReactNativeWebView existence due to timing issues on Android
  try {
    if (webview.injectedObjectJson) {
      const injectedData = JSON.parse(webview.injectedObjectJson());
      if (injectedData?.isNativeEmbed) return true;
    }
  } catch {
    // Parsing failed or method not available - fall through to default behavior
  }

  // iOS and fallback: If ReactNativeWebView exists, assume we're in native embed
  return true;
}

export function useIsNativeEmbed(): boolean {
  return useSyncExternalStore(
    // Subscribe function - no-op since value doesn't change after initial load
    () => () => {},
    // Client snapshot - check if we're in native embed
    () => isNativeEmbed(),
    // Server snapshot - always false during SSR
    () => false,
  );
}

type MessageType =
  | "sendState"
  | "clearState"
  | "REQUEST_IMAGE_PICK"
  | "REQUEST_SHARE";

function sendToNative(type: MessageType, data: unknown) {
  if (!isNativeEmbed()) return;
  getReactNativeWebView()!.postMessage(
    JSON.stringify({ type: type, data: data }),
  );
}

export function sendState<T>(key: string, value: T) {
  sendToNative("sendState", { key: key, value: value });
}

export function clearState(key: string) {
  sendToNative("clearState", { key: key });
}

// Image picker bridge for native mobile app
export type ImagePickResult =
  | { success: true; imageBase64: string; mimeType: string }
  | { success: false; canceled?: boolean; error?: string };

type ImagePickCallback = (result: ImagePickResult) => void;

let imagePickCallback: ImagePickCallback | null = null;

// Handle messages from native app
if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    try {
      const data =
        typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      if (data?.type === "IMAGE_PICK_RESULT" && imagePickCallback) {
        imagePickCallback(data.result);
        imagePickCallback = null;
      }
    } catch {
      // Ignore non-JSON messages
    }
  });
}

export function requestNativeImagePick(callback: ImagePickCallback) {
  if (!isNativeEmbed()) {
    callback({ success: false, error: "Not in native app" });
    return;
  }
  imagePickCallback = callback;
  sendToNative("REQUEST_IMAGE_PICK", {});
}

// Hook for components to use
export function useNativeImagePicker() {
  const isNative = useIsNativeEmbed();

  const pickImage = useCallback((): Promise<ImagePickResult> => {
    return new Promise((resolve) => {
      requestNativeImagePick(resolve);
    });
  }, []);

  return { isNative, pickImage };
}

// Share bridge: uses native share sheet on mobile app, Web Share API on
// supporting browsers, and falls back to copying the URL to the clipboard.
export type ShareContent = {
  url: string;
  title?: string;
  text?: string;
};

export type ShareResult =
  | { method: "native" }
  | { method: "webShare" }
  | { method: "clipboard" }
  | { method: "unsupported" };

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to legacy fallback
  }
  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
  return false;
}

export async function share(content: ShareContent): Promise<ShareResult> {
  if (isNativeEmbed()) {
    sendToNative("REQUEST_SHARE", content);
    return { method: "native" };
  }
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  ) {
    try {
      await navigator.share({
        url: content.url,
        title: content.title,
        text: content.text,
      });
      return { method: "webShare" };
    } catch (err) {
      // AbortError means the user cancelled - don't fall through to clipboard
      if ((err as DOMException)?.name === "AbortError") {
        return { method: "webShare" };
      }
      // Any other error: fall through to clipboard fallback
    }
  }
  const copied = await copyToClipboard(content.url);
  return { method: copied ? "clipboard" : "unsupported" };
}

// Helper to convert base64 to File object
export function base64ToFile(
  base64: string,
  mimeType: string,
  filename: string,
): File {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}
