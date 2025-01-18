import { useEffect, useState } from "react";

export function getReactNativeWebView(): typeof window.ReactNativeWebView {
  if (window && window.ReactNativeWebView) {
    return window.ReactNativeWebView;
  }
}

export function isNativeEmbed(): boolean {
  return !!getReactNativeWebView();
}

export function getNativeData() {
  const webview = getReactNativeWebView();
  if (webview && webview.injectedObjectJson()) {
    return JSON.parse(webview.injectedObjectJson());
  }
}

export function useIsNativeEmbed(): boolean {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isNativeEmbed());
  }, []);

  return isNative;
}

type MessageType = "sendState" | "clearState";

export function sendToNative(type: MessageType, data: any) {
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
