import Alert from "components/Alert";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  alert: {
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(2),
  },
}));

const PushNotificationDenied = () => {
  const { t } = useTranslation(AUTH);
  const userAgent = navigator.userAgent.toLowerCase();
  const classes = useStyles();

  // @TODO - Add mobile browser and OS instructions per platform
  const isMobile = () => {
    return /android|iphone|ipad/i.test(userAgent);
  };

  const getBrowserInstructions = () => {
    if (isMobile()) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.mobile.browser"
      );
    }
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
    if (isMobile()) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.mobile.os"
      );
    }

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
      "notification_settings.push_notifications.permission_denied.instructions.generic"
    );
  };

  return (
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
};

export default PushNotificationDenied;
