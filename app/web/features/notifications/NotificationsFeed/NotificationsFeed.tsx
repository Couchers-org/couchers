import { Menu, styled, Typography } from "@mui/material";
import { Check, Settings } from "@mui/icons-material";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { useTranslation } from "i18n";
import { theme } from "theme";
import { useRouter } from "next/router";
import { notificationSettingsRoute } from "routes";
import { useQuery } from "react-query";
import { ListNotificationsRes } from "proto/notifications_pb";
import { RpcError } from "grpc-web";
import { listNotificationsQueryKey } from "features/queryKeys";
import { service } from "service";
import NotificationItem from "./NotificationItem";
import dayjs from "dayjs";
import { NOTIFICATIONS_LAST_SEEN_AT_COOKIE_NAME } from "components/Navigation/LoggedInMenu";
import { timestamp2Date } from "utils/date";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";

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

  const lastSeenAt = dayjs(
    window.localStorage.getItem(NOTIFICATIONS_LAST_SEEN_AT_COOKIE_NAME),
  );

  const { data, error, isLoading } = useQuery<
    ListNotificationsRes.AsObject,
    RpcError
  >({
    queryKey: listNotificationsQueryKey,
    queryFn: () => service.notifications.listNotifications(),
  });

  const newNotifications =
    data?.notificationsList
      .filter(
        (notification) =>
          lastSeenAt &&
          dayjs(timestamp2Date(notification.created!)) > lastSeenAt,
      )
      .map((notification) => (
        <NotificationItem notification={notification} />
      )) ?? [];

  const earlierNotifications =
    data?.notificationsList
      .filter(
        (notification) =>
          lastSeenAt &&
          dayjs(timestamp2Date(notification.created!)) < lastSeenAt,
      )
      .map((notification) => (
        <NotificationItem notification={notification} />
      )) ?? [];

  const handleNotificationSettingsClick = () => {
    router.push(notificationSettingsRoute);
    onClose();
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
            maxHeight: "600px", // controls total menu height
            width: "355px",
          },
        },
      }}
    >
      <TopContentWrapper>
        <Typography variant="h3">{t("global:nav.notifications")}</Typography>
        <ActionsContainer>
          <FlexItem>
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
