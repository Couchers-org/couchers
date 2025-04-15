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

interface NotificationsFeedProps {
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
}

const ActionsContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  overflow: "hidden",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
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
            maxHeight: "600px",
            width: "355px",
          },
        },
      }}
    >
      <Typography
        variant="h3"
        sx={{ padding: `${theme.spacing(1)} ${theme.spacing(2)}` }}
      >
        {t("global:nav.notifications")}
      </Typography>
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
      <Typography sx={{ paddingLeft: theme.spacing(2), fontWeight: 500 }}>
        {t("notifications:new")}
      </Typography>
      {!isLoading &&
        data?.notificationsList.map((notification) => (
          <NotificationItem notification={notification} />
        ))}
    </Menu>
  );
};

export default NotificationsFeed;
