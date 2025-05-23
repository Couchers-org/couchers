import { Alert as MuiAlert } from "@mui/material";
import { useAuthContext } from "features/auth/AuthProvider";
import Link from "next/link";
import { usePersistedState } from "platform/usePersistedState";
import React, { useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { settingsRoute } from "routes";

import { checkPushEnabled } from "./notificationUtils";

const TIME_BETWEEN_NAGS_MS = 180 * 86400; // 180 days

export function PushNotificationBanner() {
  // the epoch value of the last time this banner was dismissed
  const [lastDismissedEpoch, setLastDismissedEpoch] = usePersistedState<
    number | null
  >("notification_banner.dismissed", null);
  const [bannerVisible, setBannerVisible] = useState<boolean>(false);

  const {
    authState: { authenticated },
  } = useAuthContext();

  useEffect(() => {
    const checkPush = async () => {
      if (!authenticated) return;
      try {
        if (!(await checkPushEnabled())) {
          setBannerVisible(
            !lastDismissedEpoch ||
              new Date().getTime() - lastDismissedEpoch > TIME_BETWEEN_NAGS_MS,
          );
        }
      } catch (error) {
        console.error("Error checking for push notification state:", error);
      }
    };

    checkPush();
  }, [authenticated]);

  const dismiss = () => {
    setLastDismissedEpoch(new Date().getTime());
    setBannerVisible(false);
  };

  return (
    bannerVisible && (
      <MuiAlert severity="info" onClose={dismiss}>
        <Trans
          i18nKey="global:push_notification_banner.message"
          components={{
            1: <Link href={settingsRoute} />,
          }}
        />
      </MuiAlert>
    )
  );
}
