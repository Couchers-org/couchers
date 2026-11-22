import { Check, MoreHoriz, Settings } from "@mui/icons-material";
import { Alert, IconButton, Menu, MenuItem, Skeleton, Stack, styled, Typography, useMediaQuery } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Pill from "components/Pill";
import { logEvent } from "features/analytics";
import { createForegroundTracker } from "features/analytics/foregroundTracker";
import { listNotificationsQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { useRouter } from "next/router";
import { ListNotificationsRes, Notification } from "proto/notifications_pb";
import { useEffect, useRef, useState } from "react";
import { notificationSettingsRoute } from "routes";
import { service } from "service";
import { theme } from "theme";
import { useIsNativeEmbed } from "utils/nativeLink";

import { summarizeNotifications } from "../analytics";
import { useMarkAllNotificationsSeen, useMarkSingleNotificationIsSeen } from "../utils/helpers";
import NotificationItem from "./NotificationItem";

interface NotificationsFeedProps {
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  badgeCount?: number;
}

type NotificationsFilter = "all" | "unread";

const TopContentWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(1, 2),
  flexShrink: 0,
}));

const NotificationsListWrapper = styled("div")(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(0, 1),
  display: "flex",
  flexDirection: "column",
}));

const StyledHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

const StyledPills = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const NotificationsFeed = ({ anchorEl, isOpen, onClose, badgeCount }: NotificationsFeedProps) => {
  const { t } = useTranslation([GLOBAL, NOTIFICATIONS]);
  const router = useRouter();

  const [internalMenuAnchorEl, setInternalMenuAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notificationsFilter, setNotificationsFilter] = useState<NotificationsFilter>("all");
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isNativeEmbed = useIsNativeEmbed();

  const isInternalMenuOpen = Boolean(internalMenuAnchorEl);

  const { data, error, isRefetching, isLoading } = useQuery<ListNotificationsRes.AsObject, RpcError>({
    queryKey: [listNotificationsQueryKey, notificationsFilter],
    queryFn: () =>
      service.notifications.listNotifications({
        onlyUnread: notificationsFilter === "unread",
      }),
  });

  const {
    error: markAllNotificationsSeenError,
    markAllNotificationsSeenMutation,
    isPending: isMarkingAllSeen,
  } = useMarkAllNotificationsSeen();

  const { error: markSingleNotificationIsSeenError, markSingleNotificationIsSeenMutation } =
    useMarkSingleNotificationIsSeen();

  // The open/close effect only reruns when the tray opens or closes, so it reads the latest state from here
  const latestRef = useRef({ data, notificationsFilter, badgeCount, isMobile, isNativeEmbed });
  latestRef.current = { data, notificationsFilter, badgeCount, isMobile, isNativeEmbed };
  const clickedNotificationIdRef = useRef<number | null>(null);
  const isOptionsMenuOpenRef = useRef(false);

  const trayProperties = () => ({
    filter: latestRef.current.notificationsFilter,
    badge_count: latestRef.current.badgeCount ?? null,
    ...summarizeNotifications(latestRef.current.data?.notificationsList),
  });

  useEffect(() => {
    if (!isOpen) return;
    const tracker = createForegroundTracker();
    document.addEventListener("visibilitychange", tracker.onVisibilityChange);
    clickedNotificationIdRef.current = null;
    logEvent("notifications.tray_opened", {
      ...trayProperties(),
      is_mobile: latestRef.current.isMobile,
      is_native_embed: latestRef.current.isNativeEmbed,
    });
    return () => {
      document.removeEventListener("visibilitychange", tracker.onVisibilityChange);
      const { foregroundMs, totalMs } = tracker.finalize();
      logEvent(
        "notifications.tray_closed",
        {
          ...trayProperties(),
          clicked_notification_id: clickedNotificationIdRef.current,
          foreground_ms: foregroundMs,
          total_ms: totalMs,
        },
        totalMs / 1000,
      );
    };
  }, [isOpen]);

  const notificationProperties = (notification: Notification.AsObject) => {
    const position = (data?.notificationsList ?? []).findIndex(
      (loaded) => loaded.notificationId === notification.notificationId,
    );
    return {
      ...trayProperties(),
      notification_id: notification.notificationId,
      topic_action: `${notification.topic}:${notification.action}`,
      was_seen: notification.isSeen,
      position,
      age_s: notification.created ? Math.round(Date.now() / 1000 - notification.created.seconds) : null,
    };
  };

  const handleNotificationClick = (notification: Notification.AsObject) => {
    clickedNotificationIdRef.current = notification.notificationId;
    logEvent("notifications.item_clicked", notificationProperties(notification));
  };

  const handleMarkIsSeen = (notification: Notification.AsObject, isSeen: boolean) => {
    if (!isSeen) {
      logEvent("notifications.item_marked_unread", notificationProperties(notification));
    }
    markSingleNotificationIsSeenMutation({ notificationId: notification.notificationId, isSeen });
  };

  const closeOptionsMenu = (action: "mark_all_read" | "settings" | null) => {
    if (isOptionsMenuOpenRef.current) {
      isOptionsMenuOpenRef.current = false;
      logEvent("notifications.options_menu_closed", { ...trayProperties(), action });
    }
    setInternalMenuAnchorEl(null);
  };

  const handleNotificationSettingsClick = () => {
    closeOptionsMenu("settings");
    router.push(notificationSettingsRoute);
    onClose();
  };

  const handleMarkAllReadClick = async (event: React.MouseEvent<HTMLLIElement>) => {
    event.stopPropagation();

    const latestNotificationId = data?.notificationsList?.[0]?.notificationId;

    if (!latestNotificationId) return;

    closeOptionsMenu("mark_all_read");

    logEvent("notifications.mark_all_read", {
      ...trayProperties(),
      latest_notification_id: latestNotificationId,
    });
    markAllNotificationsSeenMutation({ latestNotificationId });
  };

  const handleInternalMenuOpen = (event: React.MouseEvent<HTMLButtonElement>): void => {
    isOptionsMenuOpenRef.current = true;
    logEvent("notifications.options_menu_opened", trayProperties());
    setInternalMenuAnchorEl(event.currentTarget);
  };

  const handleInternalMenuClose = (): void => {
    closeOptionsMenu(null);
  };

  const handleNotificationsFilterChange = (filter: NotificationsFilter): void => {
    logEvent("notifications.filter_clicked", { ...trayProperties(), new_filter: filter });
    setNotificationsFilter(filter);
  };

  return (
    <Menu
      id="notifications-menu"
      anchorEl={anchorEl}
      onClose={onClose}
      open={isOpen}
      slotProps={{
        paper: {
          elevation: 0,
          style: {
            minHeight: "300px",
            maxHeight: "600px",
            width: "355px",
          },
          sx: {
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
            marginTop: 1.5,
          },
        },

        list: {
          "aria-labelledby": "notifications-feed-button",
        },
      }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
    >
      <TopContentWrapper>
        <StyledHeader>
          <Typography variant="h3">{t("global:nav.notifications")}</Typography>
          <IconButton
            aria-controls={isInternalMenuOpen ? "notifications-feed--more-options" : undefined}
            aria-haspopup="true"
            aria-expanded={isInternalMenuOpen ? "true" : undefined}
            id="notifications-feed--more-options"
            data-testid="notifications-feed--more-options"
            onClick={handleInternalMenuOpen}
          >
            <MoreHoriz fontSize="small" />
          </IconButton>
        </StyledHeader>
        <Menu
          anchorEl={internalMenuAnchorEl}
          id="notifications-feed--more-options"
          data-testid="notifications-feed--more-options"
          open={isInternalMenuOpen}
          onClose={handleInternalMenuClose}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                overflow: "visible",
                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                mt: 1.5,
                "& .MuiAvatar-root": {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                "&::before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: "var(--mui-palette-background-paper)",
                  transform: "translateY(-50%) rotate(45deg)",
                  zIndex: 0,
                },
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem onClick={handleMarkAllReadClick}>
            <Check fontSize="small" />
            <Typography variant="body2" sx={{ marginLeft: theme.spacing(1), fontWeight: 500 }}>
              {t("notifications:mark_all_read")}
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleNotificationSettingsClick}>
            <Settings fontSize="small" />
            <Typography variant="body2" sx={{ marginLeft: theme.spacing(1), fontWeight: 500 }}>
              {t("notifications:notification_settings.title")}
            </Typography>
          </MenuItem>
        </Menu>
        <StyledPills>
          <Pill
            variant="rounded"
            backgroundColor={notificationsFilter === "all" ? "var(--mui-palette-primary-light)" : undefined}
            onClick={() => handleNotificationsFilterChange("all")}
            sx={{
              cursor: "pointer",
              "&:hover": {
                backgroundColor:
                  notificationsFilter === "all" ? "var(--mui-palette-primary-dark)" : "var(--mui-palette-grey-300)",
              },
            }}
          >
            {t("notifications:notifications_filters.all_button")}
          </Pill>
          <Pill
            variant="rounded"
            backgroundColor={notificationsFilter === "unread" ? "var(--mui-palette-primary-light)" : undefined}
            onClick={() => handleNotificationsFilterChange("unread")}
            sx={{
              cursor: "pointer",

              "&:hover": {
                backgroundColor:
                  notificationsFilter === "unread" ? "var(--mui-palette-primary-dark)" : "var(--mui-palette-grey-300)",
              },
            }}
          >
            {t("notifications:notifications_filters.unread_button")}
          </Pill>
        </StyledPills>
      </TopContentWrapper>
      <NotificationsListWrapper>
        {(isLoading || isMarkingAllSeen) && !isRefetching ? (
          <Stack spacing={1} sx={{ padding: theme.spacing(1) }}>
            {[1, 2, 3].map((index) => (
              <Stack
                key={index}
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "flex-start",
                  p: 1,
                }}
              >
                <Skeleton variant="circular" width={32} height={32} />
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={16} />
                  <Skeleton variant="text" width="90%" height={14} />
                  <Skeleton variant="text" width="40%" height={12} />
                </Stack>
              </Stack>
            ))}
          </Stack>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ marginBottom: theme.spacing(2) }}>
                {t("notifications:error_loading")}
              </Alert>
            )}
            {markAllNotificationsSeenError ||
              (markSingleNotificationIsSeenError && (
                <Alert severity="error" sx={{ marginBottom: theme.spacing(2) }}>
                  {t("notifications:error_updating_notifications")}
                </Alert>
              ))}

            {(data?.notificationsList ?? []).length > 0 ? (
              data?.notificationsList.map((notification) => (
                <NotificationItem
                  key={notification.notificationId}
                  notification={notification}
                  onClose={onClose}
                  onClick={() => handleNotificationClick(notification)}
                  onMenuOpened={() => logEvent("notifications.item_menu_opened", notificationProperties(notification))}
                  onMenuClosed={(action) =>
                    logEvent("notifications.item_menu_closed", { ...notificationProperties(notification), action })
                  }
                  onMarkIsSeen={({ isSeen }) => handleMarkIsSeen(notification, isSeen)}
                />
              ))
            ) : (
              <Typography
                variant="body2"
                sx={{
                  marginLeft: theme.spacing(1),
                  marginBottom: theme.spacing(2),
                }}
              >
                {t("notifications:no_new_notifications")}
              </Typography>
            )}
          </>
        )}
      </NotificationsListWrapper>
    </Menu>
  );
};

export default NotificationsFeed;
