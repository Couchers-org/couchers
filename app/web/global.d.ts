interface Window {
  ReactNativeWebView?: {
    injectedObjectJson: () => any;
    postMessage: (message: string) => void;
  };
}
