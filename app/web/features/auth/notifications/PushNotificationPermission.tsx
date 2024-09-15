import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import { Trans, useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import Sentry from "platform/sentry";
import { useState } from "react";
import {
  getVapidPublicKey,
  registerPushNotificationSubscription,
} from "service/notifications";
import { arrayBufferToBase64 } from "utils/arrayBufferToBase64";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  alert: {
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(2),
  },
  alertPaper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: "#ef9a9a",
    color: theme.palette.error.contrastText,
  },
  alertPaperSpace: {
    marginBottom: theme.spacing(2),
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

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onPermissionGranted = async () => {
    // If permission is granted, subscribe the user to push notifications
    try {
      // Check if service workers and push notifications are supported
      if ("serviceWorker" in navigator && "PushManager" in window) {
        let registration = await navigator.serviceWorker.getRegistration();

        if (!registration) {
          registration = await navigator.serviceWorker.register(
            "/service-worker.js",
            {
              scope: "/",
            }
          );
        }

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
      }
    } catch (error) {
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

  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes("chrome")) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.chrome"
      );
    } else if (userAgent.includes("firefox")) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.firefox"
      );
    } else if (userAgent.includes("safari")) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.safari"
      );
    }

    return t(
      "notification_settings.push_notifications.permission_denied.instructions.generic"
    );
  };

  const getOSInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes("mac")) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.macos"
      );
    } else if (userAgent.includes("windows")) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.windows"
      );
    } else if (userAgent.includes("linux")) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.linux.gnome"
      );
    }

    return t(
      "notification_settings.push_notifications.permission_denied.instructions.generic",
      "Please check your OS settings for notification control."
    );
  };

  const turnPushNotificationsOn = async () => {
    if (Notification.permission !== "denied") {
      // @TODO Add an alert for the user to click Allow on the permission prompt
      const result = await Notification.requestPermission();

      if (result === "granted") {
        await onPermissionGranted();
      }
    } else {
      console.log("Permission denied!!");
    }
  };

  const turnPushNotificationsOff = async () => {
    let registration = await navigator.serviceWorker.getRegistration(
      "/service-worker.js"
    );

    if (!registration) {
      // Do something here? Theoretically we should never end up here.
      registration = await navigator.serviceWorker.register(
        "/service-worker.js",
        {
          scope: "/",
        }
      );
    }

    const existingPushSubscription =
      await registration.pushManager.getSubscription();

    if (existingPushSubscription) {
      await existingPushSubscription.unsubscribe();
    }
  };

  // const handleClick = async () => {
  //   if (permission === "granted") {
  //     await turnPushNotificationsOff();
  //   } else {
  //     await turnPushNotificationsOn();
  //   }
  // };

  const renderReEnablePushNotificationsAlert = () => (
    <>
      <Alert className={classes.alert} severity="error">
        {getBrowserInstructions()}
      </Alert>
      <Alert className={classes.alert} severity="error">
        {t(
          "notification_settings.push_notifications.permission_denied.platform_settings_description"
        ) +
          " " +
          getOSInstructions()}
      </Alert>
    </>
  );

  return (
    <div className={className}>
      <div className={classes.titleBox}>
        <Typography variant="h2">
          {t("notification_settings.push_notifications.title")}
        </Typography>
        {/* <CustomColorSwitch
          checked={permission == "granted"}
          onClick={handleClick}
          color={theme.palette.primary.main}
        /> */}
        <Button onClick={turnPushNotificationsOn}>Enable</Button>
        <Button onClick={turnPushNotificationsOff}>Disable</Button>
      </div>
      {errorMessage && (
        <Alert className={classes.alert} severity="error">
          {errorMessage || "Unknown error"}
        </Alert>
      )}
      {Notification.permission === "denied" &&
        renderReEnablePushNotificationsAlert()}
      <Typography variant="body1" className={classes.status}>
        {Notification.permission === "granted" ? (
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
