import { useState } from "react";

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

type MessageType = "sendState" | "clearState";

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
