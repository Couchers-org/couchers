import { useEffect, useState } from "react";

export const getReactNativeWebView = () => {
  if (window.ReactNativeWebView) {
    return window.ReactNativeWebView;
  }
};

export const isNativeEmbed = (): boolean => {
  return !!getReactNativeWebView();
};

export const getNativeData = () => {
  const webview = getReactNativeWebView();
  if (webview && webview.injectedObjectJson()) {
    return JSON.parse(webview.injectedObjectJson()) as unknown;
  }
};

export const useIsNativeEmbed = (): boolean => {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isNativeEmbed());
  }, []);

  return isNative;
};

type MessageType = "sendState" | "clearState";

export const sendToNative = (type: MessageType, data: unknown) => {
  if (!isNativeEmbed()) return;
  getReactNativeWebView()?.postMessage(JSON.stringify({ type, data }));
};

export const sendState = (key: string, value: unknown) => {
  sendToNative("sendState", { key, value });
};

export const clearState = (key: string) => {
  sendToNative("clearState", { key });
};
