interface Window {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ReactNativeWebView?: {
    injectedObjectJson: () => string;
    postMessage: (message: string) => void;
  };
  grecaptcha: GRecaptcha;
}

interface GRecaptchaEnterprise {
  execute(siteKey: string, options: { action: string }): Promise<string>;
}

interface GRecaptcha {
  enterprise: GRecaptchaEnterprise;
}
