import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import CustomColorSwitch from "components/CustomColorSwitch";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { useState } from "react";
import {
  getVapidPublicKey,
  registerPushNotificationSubscription,
} from "service/notifications";
import { theme } from "theme";
import { arrayBufferToBase64 } from "utils/arrayBufferToBase64";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  alert: {
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(2),
  },
  status: {
    marginBottom: theme.spacing(2),
  },
  titleBox: {
    display: "flex",
    alignItems: "center",
  },
}));

export default function PushNotificationPermission({
  className,
}: {
  className: string;
}) {
  const { t } = useTranslation(AUTH);
  const classes = useStyles();

  const [permission, setPermission] = useState(Notification.permission);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasPermission = permission === "granted";

  const onPermissionGranted = async () => {
    // If permission is granted, subscribe the user to push notifications
    try {
      // Check if service workers and push notifications are supported
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.register(
          "/service-worker.js",
          { scope: "/" }
        );

        const existingPushSubscription =
          await registration.pushManager.getSubscription();
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
            return;
          }
        }

        // Subscribe to push notifications using the PushManager API
        const subscription: PushSubscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidPublicKey,
          });

        await registerPushNotificationSubscription(subscription);
      } else {
        setErrorMessage(
          t("notification_settings.push_notifications.error_unsupported")
        );
      }
    } catch (error) {
      setErrorMessage(
        t("notification_settings.push_notifications.error_generic")
      );
    }
  };

  const turnPushNotificationsOn = async () => {
    if (permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        await onPermissionGranted();
      }
    } else {
      setErrorMessage(
        t("notification_settings.push_notifications.error_blocked_push")
      );
    }
  };

  const turnPushNotificationsOff = async () => {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      { scope: "/" }
    );
    const existingPushSubscription =
      await registration.pushManager.getSubscription();

    if (existingPushSubscription) {
      await existingPushSubscription.unsubscribe();
    }
    setPermission("default");
  };

  const handleClick = async () => {
    if (hasPermission) {
      await turnPushNotificationsOff();
    } else {
      await turnPushNotificationsOn();
    }
  };

  return (
    <div className={className}>
      <div className={classes.titleBox}>
        <Typography variant="h2">
          {t("notification_settings.push_notifications.title")}
        </Typography>
        <CustomColorSwitch
          checked={hasPermission}
          onClick={handleClick}
          color={theme.palette.primary.main}
        />
      </div>
      {errorMessage && (
        <Alert className={classes.alert} severity="error">
          {errorMessage || "Unknown error"}
        </Alert>
      )}
      <Typography variant="body1" className={classes.status}>
        {hasPermission ? (
          <Trans i18nKey="auth:notification_settings.push_notifications.enabled_message">
            You currently have push notifications <strong>enabled</strong>.
          </Trans>
        ) : (
          <Trans i18nKey="auth:notification_settings.push_notifications.disabled_message">
            You currently have push notifications <strong>disabled</strong>.
          </Trans>
        )}
      </Typography>
      <Typography variant="body1">
        {t("notification_settings.push_notifications.description")}
      </Typography>
    </div>
  );
}
