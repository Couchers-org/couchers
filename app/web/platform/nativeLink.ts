import { useEffect, useState } from 'react';

export function getReactNativeWebView(): typeof window.ReactNativeWebView {
  // console.log(window)
  if ((typeof window !== "undefined") && window.ReactNativeWebView !== undefined) {
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
    return JSON.parse(wv.injectedObjectJson())
  }
}

export function useIsNativeEmbed(): boolean {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    console.log(window)
    console.log(typeof window !== 'undefined')
    setIsNative(typeof window !== 'undefined' && window.ReactNativeWebView !== undefined);
  }, []);

  return isNative;
}
