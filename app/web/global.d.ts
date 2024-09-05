interface Window {
  ReactNativeWebView?: {
    injectedObjectJson: () => string;
    postMessage: (message: string) => void;
  };
}
