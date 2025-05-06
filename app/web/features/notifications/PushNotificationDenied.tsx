import { styled } from "@mui/material";
import Alert from "components/Alert";
import { useTranslation } from "i18n";
import { NOTIFICATIONS } from "i18n/namespaces";

const StyledAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  marginTop: theme.spacing(2),
}));

const PushNotificationDenied = () => {
  const { t } = useTranslation(NOTIFICATIONS);
  const userAgent = navigator.userAgent.toLowerCase();

  // @TODO - Add mobile browser and OS instructions per platform
  const isMobile = () => {
    return /android|iphone|ipad/i.test(userAgent);
  };

  const getBrowserInstructions = () => {
    if (isMobile()) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.mobile.browser",
      );
    }
    if (userAgent.includes("chrome")) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.chrome",
      );
    } else if (userAgent.includes("firefox")) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.firefox",
      );
    } else if (userAgent.includes("safari")) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.safari",
      );
    }

    return t(
      "notification_settings.push_notifications.permission_denied.instructions.generic",
    );
  };

  const getOSInstructions = () => {
    if (isMobile()) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.mobile.os",
      );
    }

    if (userAgent.includes("mac")) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.macos",
      );
    } else if (userAgent.includes("windows")) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.windows",
      );
    } else if (userAgent.includes("linux")) {
      return t(
        "notification_settings.push_notifications.permission_denied.instructions.linux.gnome",
      );
    }

    return t(
      "notification_settings.push_notifications.permission_denied.instructions.generic",
    );
  };

  return (
    <>
      <StyledAlert severity="error">{getBrowserInstructions()}</StyledAlert>
      <StyledAlert severity="error">
        {t(
          "notification_settings.push_notifications.permission_denied.platform_settings_description",
        ) +
          " " +
          getOSInstructions()}
      </StyledAlert>
    </>
  );
};

export default PushNotificationDenied;
