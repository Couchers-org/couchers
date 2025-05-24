import i18next from "i18next";
import Sentry from "platform/sentry";
import {
  getVapidPublicKey,
  registerPushNotificationSubscription,
} from "service/notifications";
import { arrayBufferToBase64 } from "utils/arrayBufferToBase64";

import { getCurrentSubscription } from "../notificationUtils";

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

const onPushNotificationPermissionGranted =
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
            return {
              success: true,
            };
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
          errorMessage: i18next.t(
            "notifications:notification_settings.push_notifications.error_unsupported",
          ),
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
        errorMessage: i18next.t(
          "notifications:notification_settings.push_notifications.error_generic",
        ),
      };
    }
  };

export { onPushNotificationPermissionGranted };
