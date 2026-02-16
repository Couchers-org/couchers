import { Alert, Button, styled } from "@mui/material";
import { useAuthContext } from "features/auth/AuthProvider";
import { Trans, useTranslation } from "i18n";
import { NOTIFICATIONS } from "i18n/namespaces";
import { usePersistedState } from "platform/usePersistedState";
import React, { useEffect, useState } from "react";
import { useIsNativeEmbed } from "utils/nativeLink";

import { checkPushEnabled, turnPushNotificationsOn } from "./utils/helpers";

const TIME_BETWEEN_NAGS_MS = 180 * 86400 * 1_000; // 180 days

const Wrapper = styled("div")({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
});

export function PushNotificationBanner() {
  const { t } = useTranslation(NOTIFICATIONS);
  const isNativeEmbed = useIsNativeEmbed();
  const isBrave =
    typeof navigator !== "undefined" &&
    "brave" in navigator &&
    typeof (navigator as Navigator & { brave?: { isBrave?: () => Promise<boolean> } }).brave
      ?.isBrave === "function";
  // the epoch value of the last time this banner was dismissed
  const [lastDismissedEpoch, setLastDismissedEpoch] = usePersistedState<
    number | null
  >("notification_banner.dismissed", null);
  const [bannerVisible, setBannerVisible] = useState<boolean>(false);
  const [shouldPromptAllow, setShouldPromptAllow] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    authState: { authenticated },
  } = useAuthContext();

  useEffect(() => {
    const checkPush = async () => {
      if (!authenticated) return;

      // Skip push notification check in native embed (WebView doesn't support it)
      if (isNativeEmbed) return;

      try {
        if (!(await checkPushEnabled())) {
          setBannerVisible(
            !lastDismissedEpoch ||
              new Date().getTime() - lastDismissedEpoch > TIME_BETWEEN_NAGS_MS,
          );
        }
      } catch (error) {
        // Only log errors for web browsers, not mobile WebView
        if (isNativeEmbed) {
          console.debug(
            "Push notifications not available in mobile app:",
            error,
          );
        } else {
          console.error("Error checking for push notification state:", error);
        }
      }
    };

    checkPush();
  }, [authenticated, lastDismissedEpoch, isNativeEmbed]);

  const dismiss = () => {
    setLastDismissedEpoch(new Date().getTime());
    setBannerVisible(false);
  };

  const turnPushNotificationsOnWrap = async () => {
    const result = await turnPushNotificationsOn(setShouldPromptAllow);
    if (!result.success) {
      setErrorMessage(t(result.errorMessage));
    } else {
      setBannerVisible(false);
    }
  };

  if (!bannerVisible) return null;

  if (errorMessage) {
    return (
      <>
        <Alert severity="error" onClose={dismiss}>
          {errorMessage}
        </Alert>
        {isBrave && (
          <Alert severity="info" onClose={dismiss} sx={{ marginTop: 1 }}>
            {t(
              "notification_settings.push_notifications.brave_push_messaging_note",
            )}
          </Alert>
        )}
      </>
    );
  }

  return shouldPromptAllow ? (
    <Alert severity="info" onClose={dismiss}>
      {t("notifications:notification_settings.push_notifications.allow_push")}
    </Alert>
  ) : (
    <Alert
      severity="info"
      onClose={dismiss}
      sx={{ alignItems: "center", ".MuiAlert-message": { width: "100%" } }}
    >
      <Wrapper>
        <Trans i18nKey="notifications:push_notification_banner.message" />
        <Button
          variant="outlined"
          sx={{ backgroundColor: "var(--mui-palette-common-paper)" }}
          onClick={turnPushNotificationsOnWrap}
        >
          {t("notifications:push_notification_banner.confirm")}
        </Button>
      </Wrapper>
    </Alert>
  );
}
