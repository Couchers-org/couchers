import { useCallback, useState } from "react";

function getReactNativeWebView(): typeof window.ReactNativeWebView {
  if (typeof window !== "undefined" && window.ReactNativeWebView) {
    return window.ReactNativeWebView;
  }
}

function isNativeEmbed(): boolean {
  return !!getReactNativeWebView();
}

export function useIsNativeEmbed(): boolean {
  const [isNative] = useState(() => isNativeEmbed());
  return isNative;
}

type MessageType = "sendState" | "clearState" | "REQUEST_IMAGE_PICK";

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
