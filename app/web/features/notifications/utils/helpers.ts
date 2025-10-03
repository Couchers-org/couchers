import { useMutation, useQueryClient } from "@tanstack/react-query";

import { LIST_NOTIFICATIONS_QUERY_KEY } from "@/features/queryKeys";
import log from "@/log";
import { Sentry } from "@/platform/sentry";
import { ListNotificationsRes } from "@/proto/notifications_pb";
import { service } from "@/service";
import serviceClients from "@/serviceClients";
import { arrayBufferToBase64 } from "@/utils/arrayBufferToBase64";

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
        const { vapidPublicKey } =
          await serviceClients.notifications.getVapidPublicKey({});

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

        if (!registration) {
          return {
            success: false,
            errorMessage: "Failed to get service worker registration",
          };
        }

        // Subscribe to push notifications via the PushManager
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });

        await serviceClients.notifications.registerPushNotificationSubscription(
          {
            userAgent: navigator.userAgent,
            fullSubscriptionJson: JSON.stringify(subscription),
          },
        );

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
      log.error("Error subscribing to push notifications", error);

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

  return registration.pushManager.getSubscription();
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
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: [LIST_NOTIFICATIONS_QUERY_KEY],
      });

      const previousData =
        queryClient.getQueryData<ListNotificationsRes.AsObject>([
          LIST_NOTIFICATIONS_QUERY_KEY,
        ]);

      const newData: ListNotificationsRes.AsObject = {
        ...previousData,
        notificationsList: previousData?.notificationsList
          ? previousData.notificationsList.map((notification) => ({
              ...notification,
              isSeen: true,
            }))
          : [],
        nextPageToken: previousData?.nextPageToken ?? "",
      };

      if (previousData) {
        queryClient.setQueryData<ListNotificationsRes.AsObject>(
          [LIST_NOTIFICATIONS_QUERY_KEY],
          newData,
        );
      }

      return { previousData };
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
    onMutate: async ({ notificationId, isSeen }) => {
      await queryClient.cancelQueries({
        queryKey: [LIST_NOTIFICATIONS_QUERY_KEY],
      });

      const previousData =
        queryClient.getQueryData<ListNotificationsRes.AsObject>([
          LIST_NOTIFICATIONS_QUERY_KEY,
        ]);

      const newData: ListNotificationsRes.AsObject = {
        ...previousData,
        notificationsList: previousData?.notificationsList
          ? previousData.notificationsList.map((notification) =>
              notification.notificationId === notificationId
                ? { ...notification, isSeen }
                : notification,
            )
          : [],
        nextPageToken: previousData?.nextPageToken ?? "",
      };

      if (previousData) {
        queryClient.setQueryData<ListNotificationsRes.AsObject>(
          [LIST_NOTIFICATIONS_QUERY_KEY],
          newData,
        );
      }

      return { previousData };
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
