import { Check, Settings } from "@mui/icons-material";
import { Alert, Menu, styled, Typography } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { listNotificationsQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { useRouter } from "next/router";
import { ListNotificationsRes } from "proto/notifications_pb";
import { useQuery } from "react-query";
import { notificationSettingsRoute } from "routes";
import { service } from "service";
import { markAllNotificationsSeen } from "service/notifications";
import { theme } from "theme";

import NotificationItem from "./NotificationItem";

interface NotificationsFeedProps {
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
}

const ActionsContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  marginBottom: theme.spacing(1),
}));

const FlexItem = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  width: "100%",
  cursor: "pointer",
  padding: theme.spacing(1),

  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const TopContentWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(1, 2),
  flexShrink: 0,
}));

const NotificationsListWrapper = styled("div")(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(0, 2),
  display: "flex",
  flexDirection: "column",
}));

const NotificationsFeed = ({
  anchorEl,
  isOpen,
  onClose,
}: NotificationsFeedProps) => {
  const { t } = useTranslation([GLOBAL, NOTIFICATIONS]);
  const router = useRouter();

  const { data, error, isLoading } = useQuery<
    ListNotificationsRes.AsObject,
    RpcError
  >({
    queryKey: listNotificationsQueryKey,
    queryFn: () => service.notifications.listNotifications(),
  });

  const newNotifications =
    data?.notificationsList
      .filter((notification) => !notification.isSeen)
      .map((notification) => (
        <NotificationItem
          key={notification.notificationId}
          notification={notification}
        />
      )) ?? [];

  const earlierNotifications =
    data?.notificationsList
      .filter((notification) => notification.isSeen)
      .map((notification) => (
        <NotificationItem
          key={notification.notificationId}
          notification={notification}
        />
      )) ?? [];

  const handleNotificationSettingsClick = () => {
    router.push(notificationSettingsRoute);
    onClose();
  };

  const handleMarkAllReadClick = async () => {
    try {
      await markAllNotificationsSeen();
    } catch (e) {
      console.error("Error marking all notifications as seen", e);
    }
  };

  return (
    <Menu
      id="notifications-menu"
      anchorEl={anchorEl}
      onClose={onClose}
      open={isOpen}
      MenuListProps={{
        "aria-labelledby": "notifications-feed-button",
      }}
      slotProps={{
        paper: {
          style: {
            maxHeight: "600px",
            width: "355px",
          },
        },
      }}
    >
      <TopContentWrapper>
        <Typography variant="h3">{t("global:nav.notifications")}</Typography>
        <ActionsContainer>
          <FlexItem onClick={handleMarkAllReadClick}>
            <Check fontSize="small" />
            <Typography
              variant="body2"
              sx={{ marginLeft: theme.spacing(1), fontWeight: 500 }}
            >
              {t("notifications:mark_all_read")}
            </Typography>
          </FlexItem>
          <FlexItem onClick={handleNotificationSettingsClick}>
            <Settings fontSize="small" />
            <Typography
              variant="body2"
              sx={{ marginLeft: theme.spacing(1), fontWeight: 500 }}
            >
              {t("notifications:notification_settings.title")}
            </Typography>
          </FlexItem>
        </ActionsContainer>
      </TopContentWrapper>
      <NotificationsListWrapper>
        {isLoading ? (
          <CenteredSpinner />
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ marginBottom: theme.spacing(2) }}>
                {t("notifications:error_loading")}
              </Alert>
            )}
            <Typography
              sx={{
                fontWeight: 500,
                marginBottom: theme.spacing(1),
              }}
            >
              {t("notifications:new")}
            </Typography>
            {newNotifications.length > 0 ? (
              newNotifications
            ) : (
              <Typography
                variant="body2"
                sx={{ marginBottom: theme.spacing(2) }}
              >
                {t("notifications:no_new_notifications")}
              </Typography>
            )}
            {earlierNotifications.length > 0 && (
              <Typography
                sx={{
                  fontWeight: 500,
                  marginBottom: theme.spacing(1),
                }}
              >
                {t("notifications:earlier")}
              </Typography>
            )}
            {earlierNotifications}
          </>
        )}
      </NotificationsListWrapper>
    </Menu>
  );
};

export default NotificationsFeed;
