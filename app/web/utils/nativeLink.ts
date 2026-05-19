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

export type NativePlatform = "ios" | "android";

// Returns the native app platform when running inside the mobile app's WebView, otherwise null.
export function getNativePlatform(): NativePlatform | null {
  const webview = getReactNativeWebView();
  if (!webview?.injectedObjectJson) return null;

  try {
    const injectedData = JSON.parse(webview.injectedObjectJson());
    const platform = injectedData?.nativePlatform;
    if (platform === "ios" || platform === "android") return platform;
  } catch {
    // Parsing failed or method not available - treat as not native
  }
  return null;
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
  | "NATIVE_BACK"
  | "LANGUAGE_CHANGE";

function sendToNative(type: MessageType, data: unknown) {
  if (!isNativeEmbed()) return;
  getReactNativeWebView()!.postMessage(
    JSON.stringify({ type: type, data: data }),
  );
}

export function sendNativeBack() {
  sendToNative("NATIVE_BACK", {});
}

export function sendState<T>(key: string, value: T) {
  sendToNative("sendState", { key: key, value: value });
}

export function clearState(key: string) {
  sendToNative("clearState", { key: key });
}

export function sendLanguageChange(locale: string) {
  sendToNative("LANGUAGE_CHANGE", { locale });
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
