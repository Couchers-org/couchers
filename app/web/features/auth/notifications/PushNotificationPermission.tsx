import { Typography } from "@material-ui/core";
import Button from "components/Button";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { useState } from "react";
import {
  getVapidPublicKey,
  registerPushNotificationSubscription,
} from "service/notifications";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  turnOffButton: {
    backgroundColor: theme.palette.error.main,
    "&:hover": {
      backgroundColor: theme.palette.error.dark,
    },
  },
}));

const subscribeUserToPush = async () => {
  try {
    // Check if service workers and push notifications are supported
    if ("serviceWorker" in navigator && "PushManager" in window) {
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js",
        { scope: "/" }
      );
      console.log("Service Worker registered with scope:", registration.scope);

      const { vapidPublicKey } = await getVapidPublicKey();

      // Subscribe to push notifications using the PushManager API
      const subscription: PushSubscription =
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });

      await registerPushNotificationSubscription(subscription);

      console.log("User is subscribed to push notifications:", subscription);
      return subscription;
    } else {
      console.log(
        "Push notifications or Service Workers are not supported in this browser."
      );
    }
  } catch (error) {
    console.error("Error during subscription to push notifications:", error);
  }
};

// const unsubscribeUserFromPush = async () => {
//   const existingPushSubscription =
//     await registration.pushManager.getSubscription();
//   const p256dhKey = existingPushSubscription?.getKey("p256dh");
//   const { vapidPublicKey } = await getVapidPublicKey();

//   if (existingPushSubscription && p256dhKey) {
//     const publicKey = arrayBufferToBase64(p256dhKey);

//     if (publicKey !== vapidPublicKey) {
//       await existingPushSubscription.unsubscribe();
//     } else {
//       return;
//     }
//   }
// };

export default function PushNotificationPermission({
  className,
}: {
  className: string;
}) {
  const [permission, setPermission] = useState(Notification.permission);

  const { t } = useTranslation(AUTH);
  const classes = useStyles();

  //   const existingPushSubscription =
  //   await registration.pushManager.getSubscription();
  // const p256dhKey = existingPushSubscription?.getKey("p256dh");
  // const { vapidPublicKey } = await getVapidPublicKey();

  // if (existingPushSubscription && p256dhKey) {
  //   const publicKey = arrayBufferToBase64(p256dhKey);

  //   if (publicKey !== vapidPublicKey) {
  //     await existingPushSubscription.unsubscribe();
  //   } else {
  //     return;
  //   }
  // }

  const handleTurnOnClick = async () => {
    if (permission === "default") {
      // Request permission to send notifications
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        // If permission is granted, subscribe the user to push notifications
        const subscription = await subscribeUserToPush();
        console.log("Push notification subscription successful:", subscription);
      } else {
        console.log("Permission for notifications was denied.");
      }
    } else if (permission === "granted") {
      console.log("You have already granted permission for notifications.");
    }
  };

  const handleTurnOffClick = async () => {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      { scope: "/" }
    );
    console.log("REGISTRATION", registration);
    const existingPushSubscription =
      await registration.pushManager.getSubscription();
    console.log("EXISTING PUSH SUBSCRIPTION", existingPushSubscription);
    if (existingPushSubscription) {
      await existingPushSubscription.unsubscribe();
    }
    setPermission("default");
  };

  return (
    <div className={className}>
      <Typography variant="h2">
        {t("notification_settings.push_notifications.title")}
      </Typography>
      <Typography variant="body1">
        {t("notification_settings.push_notifications.description")}
      </Typography>
      {permission === "granted" ? (
        <Button onClick={handleTurnOffClick} className={classes.turnOffButton}>
          {t("notification_settings.push_notifications.turn_off")}
        </Button>
      ) : (
        <Button onClick={handleTurnOnClick}>
          {t("notification_settings.push_notifications.turn_on")}
        </Button>
      )}
    </div>
  );
}
