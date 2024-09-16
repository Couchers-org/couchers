import { t } from "i18next";

const getBrowserInstructions = (givenUserAgent: string) => {
  const normalizedUserAgent = givenUserAgent.toLowerCase();
  const userAgent = normalizedUserAgent.includes("chrome")
    ? "chrome"
    : normalizedUserAgent.includes("firefox")
    ? "firefox"
    : normalizedUserAgent.includes("safari")
    ? "safari"
    : "generic";

  switch (userAgent) {
    case "chrome":
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.chrome"
      );
    case "firefox":
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.firefox"
      );
    case "safari":
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.safari"
      );
    default:
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.generic"
      );
  }
};

const getCurrentSubscription = async () => {
  let registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      {
        scope: "/",
      }
    );
  }

  return registration?.pushManager.getSubscription();
};

const getOSInstructions = (givenUserAgent: string) => {
  const normalizedUserAgent = givenUserAgent.toLowerCase();
  const userAgent = normalizedUserAgent.includes("mac")
    ? "mac"
    : normalizedUserAgent.includes("windows")
    ? "windows"
    : normalizedUserAgent.includes("linux")
    ? "linux"
    : "generic";

  switch (userAgent) {
    case "mac":
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.macos"
      );
    case "windows":
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.windows"
      );
    case "linux":
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.linux.gnome"
      );
    default:
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.generic"
      );
  }
};

export { getBrowserInstructions, getCurrentSubscription, getOSInstructions };
