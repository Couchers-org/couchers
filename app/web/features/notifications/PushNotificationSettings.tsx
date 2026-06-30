import { styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import CustomColorSwitch from "components/CustomColorSwitch";
import { Trans, useTranslation } from "i18n";
import { NOTIFICATIONS } from "i18n/namespaces";
import Sentry from "platform/sentry";
import { useEffect, useState } from "react";
import { theme } from "theme";
import { useIsNativeEmbed } from "utils/nativeLink";

import PushNotificationDenied from "./PushNotificationDenied";
import {
  checkPushEnabled,
  turnPushNotificationsOff,
  turnPushNotificationsOn,
} from "./utils/helpers";

const StyledAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  marginTop: theme.spacing(2),
}));

const StyledTitleBox = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

export default function PushNotificationSettings() {
  const { t } = useTranslation([NOTIFICATIONS]);
  const isNotificationSupported = typeof Notification !== "undefined";
  const isNativeEmbed = useIsNativeEmbed();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPushEnabled, setIsPushEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [shouldPromptAllow, setShouldPromptAllow] = useState<boolean>(false); // whether to show the user instructions to click 'Allow' in their browser

  useEffect(() => {
    if (isNativeEmbed) return;

    const checkPushEnabledWrap = async () => {
      try {
        setIsPushEnabled(await checkPushEnabled());
      } catch (e) {
        setErrorMessage(
          t("notification_settings.push_notifications.error_unsupported"),
        );
        Sentry.captureException(e, {
          tags: {
            component: "PushNotificationPermission",
            action: "onPermissionGranted",
            userAgent: navigator.userAgent,
          },
        });
      }
      setIsLoading(false);
    };

    checkPushEnabledWrap();
  }, [t, isNativeEmbed]);

  const turnPushNotificationsOnWrap = async () => {
    setIsLoading(true);
    const result = await turnPushNotificationsOn(setShouldPromptAllow);
    if (!result.success) {
      setErrorMessage(result.errorMessage);
    } else {
      setIsPushEnabled(true);
    }
    setIsLoading(false);
  };

  const turnPushNotificationsOffWrap = async () => {
    setIsLoading(true);
    if (await turnPushNotificationsOff()) {
      setIsPushEnabled(false);
    }
    setIsLoading(false);
  };

  return (
    <div>
      <StyledTitleBox>
        <Typography variant="h2">
          {t("notification_settings.push_notifications.title")}
        </Typography>
        <CustomColorSwitch
          checked={isPushEnabled}
          onClick={
            isPushEnabled
              ? turnPushNotificationsOffWrap
              : turnPushNotificationsOnWrap
          }
          customColor={theme.palette.primary.main}
          isLoading={isLoading}
        />
      </StyledTitleBox>
      {errorMessage && (
        <StyledAlert severity="error">
          {errorMessage
            ? t(errorMessage)
            : t("notification_settings.push_notifications.error_generic")}
        </StyledAlert>
      )}
      {shouldPromptAllow && (
        <Alert severity="info">
          {t("notification_settings.push_notifications.allow_push")}
        </Alert>
      )}
      {isNotificationSupported && Notification.permission === "denied" && (
        <PushNotificationDenied />
      )}
      <Typography variant="body1" sx={{ marginBottom: theme.spacing(2) }}>
        {isPushEnabled ? (
          <Trans
            i18nKey="notifications:notification_settings.push_notifications.enabled_message"
            components={{ 1: <strong /> }}
          />
        ) : (
          <Trans
            i18nKey="notifications:notification_settings.push_notifications.disabled_message"
            components={{ 1: <strong /> }}
          />
        )}
      </Typography>
      <Typography variant="body1">
        {t("notification_settings.push_notifications.description")}
      </Typography>
    </div>
  );
}
