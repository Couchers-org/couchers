import { useMutation, useQueryClient } from "@tanstack/react-query";
import { listNotificationsQueryKey, pingQueryKey } from "features/queryKeys";
import Sentry from "platform/sentry";
import { ListNotificationsRes } from "proto/notifications_pb";
import { service } from "service";
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

const getCurrentSubscription = async () => {
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
  // Return false if service workers or push notifications aren't supported
  // (e.g., in mobile WebViews, Safari private browsing, etc.)
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  const existingPushSubscription = await getCurrentSubscription();
  return (
    Notification.permission === "granted" && existingPushSubscription !== null
  );
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

export const useMarkAllNotificationsSeen = () => {
  const queryClient = useQueryClient();

  const { error, mutate, isPending } = useMutation({
    mutationFn: async ({
      latestNotificationId,
    }: {
      latestNotificationId: number;
    }) =>
      await service.notifications.markAllNotificationsSeen(
        latestNotificationId,
      ),
    onMutate: () => {
      queryClient.cancelQueries({
        queryKey: [listNotificationsQueryKey],
      });

      // Update all notification queries (both "all" and "unread" filters)
      queryClient.setQueriesData<ListNotificationsRes.AsObject>(
        {
          queryKey: [listNotificationsQueryKey],
        },
        (previousData) => {
          if (!previousData) return previousData;

          return {
            ...previousData,
            notificationsList: previousData.notificationsList
              ? previousData.notificationsList.map((notification) => ({
                  ...notification,
                  isSeen: true,
                }))
              : [],
            nextPageToken: previousData.nextPageToken ?? "",
          };
        },
      );
    },
    onSuccess: () => {
      // Invalidate the ping query to update the notification badge count
      queryClient.invalidateQueries({
        queryKey: [pingQueryKey],
      });
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          component: "useMarkAllNotificationsSeen",
          action: "onMutate",
        },
      });
    },
  });

  return { error, markAllNotificationsSeenMutation: mutate, isPending };
};

export const useMarkSingleNotificationIsSeen = () => {
  const queryClient = useQueryClient();

  const { error, mutate, isPending } = useMutation({
    mutationFn: async ({
      notificationId,
      isSeen,
    }: {
      notificationId: number;
      isSeen: boolean;
    }) =>
      await service.notifications.markNotificationSeen(notificationId, isSeen),
    onMutate: ({ notificationId, isSeen }) => {
      queryClient.cancelQueries({
        queryKey: [listNotificationsQueryKey],
      });

      // Update all notification queries (both "all" and "unread" filters)
      queryClient.setQueriesData<ListNotificationsRes.AsObject>(
        {
          queryKey: [listNotificationsQueryKey],
        },
        (previousData) => {
          if (!previousData) return previousData;

          return {
            ...previousData,
            notificationsList: previousData.notificationsList
              ? previousData.notificationsList.map((notification) =>
                  notification.notificationId === notificationId
                    ? { ...notification, isSeen: isSeen }
                    : notification,
                )
              : [],
            nextPageToken: previousData.nextPageToken ?? "",
          };
        },
      );
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          component: "useMarkSingleNotificationSeen",
          action: "onMutate",
        },
      });
    },
  });

  return { error, markSingleNotificationIsSeenMutation: mutate, isPending };
};
