import Sentry from "platform/sentry";
import {
  getVapidPublicKey,
  registerPushNotificationSubscription,
} from "service/notifications";
import { arrayBufferToBase64 } from "utils/arrayBufferToBase64";

interface PushNotificationPermissionSuccessResponse {
  success: true;
}

interface PushNotificationPermissionErrorResponse {
  success: false;
  errorMessage: string;
}

type PushNotificationPermissionResponse =
  | PushNotificationPermissionSuccessResponse
  | PushNotificationPermissionErrorResponse;

export const onPushNotificationPermissionGranted =
  async (): Promise<PushNotificationPermissionResponse> => {
    try {
      // Check if service workers and push notifications are supported
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const existingPushSubscription = await getCurrentSubscription();
        const p256dhKey = existingPushSubscription?.getKey("p256dh");
        const { vapidPublicKey } = await getVapidPublicKey();

        if (existingPushSubscription && p256dhKey) {
          const publicKey = arrayBufferToBase64(p256dhKey);

          /**
           * The purpose of this check is to ensure that the push subscription is correctly authenticated with the server’s VAPID key.
           * If the client’s p256dh key no longer matches the server’s vapidPublicKey, then the subscription is unsubscribed and needs
           * to be re-registered to ensure the security and validity of the Web Push connection.
           */
          if (publicKey !== vapidPublicKey) {
            await existingPushSubscription.unsubscribe();
          } else {
            return { success: true };
          }
        }

        const registration = await navigator.serviceWorker.getRegistration();

        // Subscribe to push notifications via the PushManager
        const subscription: PushSubscription =
          await registration!.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidPublicKey,
          });

        await registerPushNotificationSubscription(subscription);

        return { success: true };
      } else {
        Sentry.captureException(
          new Error("Push notifications or service workers not supported"),
          {
            tags: {
              component: "PushNotificationPermission",
              action: "onPermissionGranted",
              userAgent: navigator.userAgent,
            },
          },
        );
        return {
          success: false,
          errorMessage:
            "notifications:notification_settings.push_notifications.error_unsupported",
        };
      }
    } catch (error) {
      console.error("Error subscribing to push notifications", error);

      Sentry.captureException(error, {
        tags: {
          component: "PushNotificationPermission",
          action: "onPermissionGranted",
        },
      });

      return {
        success: false,
        errorMessage:
          "notifications:notification_settings.push_notifications.error_generic",
      };
    }
  };

export const getCurrentSubscription = async () => {
  let registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      {
        scope: "/",
      },
    );
  }

  return registration?.pushManager.getSubscription();
};

export const checkPushEnabled = async () => {
  if ("serviceWorker" in navigator && "PushManager" in window) {
    const existingPushSubscription = await getCurrentSubscription();
    return (
      Notification.permission === "granted" && existingPushSubscription !== null
    );
  } else {
    throw new Error("Push notifications or service workers not supported");
  }
};

export const turnPushNotificationsOn = async (
  setShouldPromptAllow: (on: boolean) => void,
): Promise<PushNotificationPermissionResponse> => {
  if (Notification.permission !== "denied") {
    setShouldPromptAllow(true);
    const result = await Notification.requestPermission();
    setShouldPromptAllow(false);

    if (result === "granted") {
      return await onPushNotificationPermissionGranted();
    }
  }
  return {
    success: false,
    errorMessage:
      "notifications:notification_settings.push_notifications.error_not_granted",
  };
};

export const turnPushNotificationsOff = async () => {
  const existingPushSubscription = await getCurrentSubscription();

  if (existingPushSubscription) {
    await existingPushSubscription.unsubscribe();
    return true;
  }
  return false;
};
