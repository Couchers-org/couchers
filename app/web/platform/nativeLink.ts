import { useEffect, useState } from "react";

export function getReactNativeWebView(): typeof window.ReactNativeWebView {
  if (
    typeof window !== "undefined" &&
    window.ReactNativeWebView !== undefined
  ) {
    return window.ReactNativeWebView;
  }
}

export function isNativeEmbed(): boolean {
  return getReactNativeWebView() !== undefined;
}

export function getNativeData() {
  const wv = getReactNativeWebView();
  if (!wv) return;
  if (wv.injectedObjectJson()) {
    return JSON.parse(wv.injectedObjectJson());
  }
}

export function useIsNativeEmbed(): boolean {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(
      typeof window !== "undefined" && window.ReactNativeWebView !== undefined
    );
  }, []);

  return isNative;
}

type MessageType = "sendState" | "clearState";

export function sendToNative(type: MessageType, data: any) {
  if (!isNativeEmbed()) return;
  getReactNativeWebView()!.postMessage(
    JSON.stringify({ type: type, data: data })
  );
}

export function getState<T>(key: string) {
  if (!isNativeEmbed()) return undefined;
  const data = getNativeData();
  // if ()
}

export function sendState<T>(key: string, value: T) {
  sendToNative("sendState", { key: key, value: value });
}

export function clearState(key: string) {
  sendToNative("clearState", { key: key });
}
