import { Typography } from "@mui/material";
import Alert from "components/Alert";
import CustomColorSwitch from "components/CustomColorSwitch";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import Sentry from "platform/sentry";
import { useEffect, useState } from "react";
import {
  getVapidPublicKey,
  registerPushNotificationSubscription,
} from "service/notifications";
import { theme } from "theme";
import { arrayBufferToBase64 } from "utils/arrayBufferToBase64";
import makeStyles from "utils/makeStyles";

import { getCurrentSubscription } from "./notificationUtils";
import PushNotificationDenied from "./PushNotificationDenied";

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

export default function PushNotificationSettings({
  className,
}: {
  className: string;
}) {
  const { t } = useTranslation(AUTH);
  const classes = useStyles();
  const isNotificationSupported = typeof Notification !== "undefined";

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPushEnabled, setIsPushEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [shouldPromptAllow, setShouldPromptAllow] = useState<boolean>(false); // whether to show the user instructions to click 'Allow' in their browser

  useEffect(() => {
    const checkPushEnabled = async () => {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const existingPushSubscription = await getCurrentSubscription();
        setIsPushEnabled(
          Notification.permission === "granted" &&
            existingPushSubscription !== null
        );
      } else {
        setErrorMessage(
          t("notification_settings.push_notifications.error_unsupported")
        );
        Sentry.captureException(
          new Error("Push notifications or service workers not supported"),
          {
            tags: {
              component: "PushNotificationPermission",
              action: "onPermissionGranted",
              userAgent: navigator.userAgent,
            },
          }
        );
      }
      setIsLoading(false);
    };

    checkPushEnabled();
  }, [t]);

  const onPermissionGranted = async () => {
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
            return;
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
      } else {
        setErrorMessage(
          t("notification_settings.push_notifications.error_unsupported")
        );
        Sentry.captureException(
          new Error("Push notifications or service workers not supported"),
          {
            tags: {
              component: "PushNotificationPermission",
              action: "onPermissionGranted",
              userAgent: navigator.userAgent,
            },
          }
        );
      }
    } catch (error) {
      console.error("Error subscribing to push notifications", error);
      setErrorMessage(
        t("notification_settings.push_notifications.error_generic")
      );

      Sentry.captureException(error, {
        tags: {
          component: "PushNotificationPermission",
          action: "onPermissionGranted",
        },
      });
    }
  };

  const turnPushNotificationsOn = async () => {
    if (Notification.permission !== "denied") {
      setIsLoading(true);
      setShouldPromptAllow(true);
      const result = await Notification.requestPermission();
      setShouldPromptAllow(false);

      if (result === "granted") {
        await onPermissionGranted();
        setIsPushEnabled(true);
      } else {
        setIsPushEnabled(false);
      }
      setIsLoading(false);
    } else {
      setIsPushEnabled(false);
    }
  };

  const turnPushNotificationsOff = async () => {
    setIsLoading(true);
    const existingPushSubscription = await getCurrentSubscription();

    if (existingPushSubscription) {
      await existingPushSubscription.unsubscribe();
      setIsPushEnabled(false);
    }
    setIsLoading(false);
  };

  return (
    <div className={className}>
      <div className={classes.titleBox}>
        <Typography variant="h2">
          {t("notification_settings.push_notifications.title")}
        </Typography>
        <CustomColorSwitch
          checked={isPushEnabled}
          onClick={
            isPushEnabled ? turnPushNotificationsOff : turnPushNotificationsOn
          }
          customColor={theme.palette.primary.main}
          isLoading={isLoading}
        />
      </div>
      {errorMessage && (
        <Alert className={classes.alert} severity="error">
          {errorMessage ||
            t("notification_settings.push_notifications.error_generic")}
        </Alert>
      )}
      {shouldPromptAllow && (
        <Alert severity="info">
          {t("notification_settings.push_notifications.allow_push")}
        </Alert>
      )}
      {isNotificationSupported && Notification.permission === "denied" && (
        <PushNotificationDenied />
      )}
      <Typography variant="body1" className={classes.status}>
        {isPushEnabled ? (
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
