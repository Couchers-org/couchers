import { Check, MoreHoriz, Settings } from "@mui/icons-material";
import {
  Alert,
  IconButton,
  Menu,
  MenuItem,
  styled,
  Typography,
} from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Pill from "components/Pill";
import { listNotificationsQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { useRouter } from "next/router";
import { ListNotificationsRes } from "proto/notifications_pb";
import { useState } from "react";
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

const NotificationsFeed = ({
  anchorEl,
  isOpen,
  onClose,
}: NotificationsFeedProps) => {
  const { t } = useTranslation([GLOBAL, NOTIFICATIONS]);
  const router = useRouter();

  const [internalMenuAnchorEl, setInternalMenuAnchorEl] =
    useState<HTMLButtonElement | null>(null);
  const [notificationsFilter, setNotificationsFilter] = useState<
    "all" | "unread"
  >("all");

  const isInternalMenuOpen = Boolean(internalMenuAnchorEl);

  const { data, error, isRefetching, isLoading, refetch } = useQuery<
    ListNotificationsRes.AsObject,
    RpcError
  >({
    queryKey: [listNotificationsQueryKey, notificationsFilter],
    queryFn: () =>
      service.notifications.listNotifications({
        onlyUnread: notificationsFilter === "unread",
      }),
  });

  const handleNotificationSettingsClick = () => {
    router.push(notificationSettingsRoute);
    onClose();
  };

  const handleMarkAllReadClick = async (
    event: React.MouseEvent<HTMLLIElement>,
  ) => {
    event.stopPropagation();

    try {
      const lastestNotificationId =
        data?.notificationsList?.[0]?.notificationId;

      if (!lastestNotificationId) return;

      setInternalMenuAnchorEl(null);

      await markAllNotificationsSeen(lastestNotificationId);
      refetch();
    } catch (e) {
      console.error("Error marking all notifications as seen", e);
    }
  };

  const handleInternalMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
  ): void => {
    setInternalMenuAnchorEl(event.currentTarget);
  };

  const handleInternalMenuClose = (): void => {
    setInternalMenuAnchorEl(null);
  };

  const handleNotificationsFilterChange = (filter: "all" | "unread"): void => {
    setNotificationsFilter(filter);
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
      }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
    >
      <TopContentWrapper>
        <StyledHeader>
          <Typography variant="h3">{t("global:nav.notifications")}</Typography>
          <IconButton
            aria-controls={
              isInternalMenuOpen
                ? "notifications-feed--more-options"
                : undefined
            }
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
          onClick={handleInternalMenuClose}
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
                  bgcolor: "background.paper",
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
            <Typography
              variant="body2"
              sx={{ marginLeft: theme.spacing(1), fontWeight: 500 }}
            >
              {t("notifications:mark_all_read")}
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleNotificationSettingsClick}>
            <Settings fontSize="small" />
            <Typography
              variant="body2"
              sx={{ marginLeft: theme.spacing(1), fontWeight: 500 }}
            >
              {t("notifications:notification_settings.title")}
            </Typography>
          </MenuItem>
        </Menu>
        <StyledPills>
          <Pill
            variant="rounded"
            backgroundColor={
              notificationsFilter === "all"
                ? theme.palette.primary.light
                : undefined
            }
            onClick={() => handleNotificationsFilterChange("all")}
            sx={{
              cursor: "pointer",
              "&:hover": {
                backgroundColor:
                  notificationsFilter === "all"
                    ? theme.palette.primary.dark
                    : theme.palette.grey[300],
              },
            }}
          >
            {t("notifications:all")}
          </Pill>
          <Pill
            variant="rounded"
            backgroundColor={
              notificationsFilter === "unread"
                ? theme.palette.primary.light
                : undefined
            }
            onClick={() => handleNotificationsFilterChange("unread")}
            sx={{
              cursor: "pointer",

              "&:hover": {
                backgroundColor:
                  notificationsFilter === "unread"
                    ? theme.palette.primary.dark
                    : theme.palette.grey[300],
              },
            }}
          >
            {t("notifications:unread")}
          </Pill>
        </StyledPills>
      </TopContentWrapper>
      <NotificationsListWrapper>
        {isLoading && !isRefetching ? (
          <CenteredSpinner />
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ marginBottom: theme.spacing(2) }}>
                {t("notifications:error_loading")}
              </Alert>
            )}

            {(data?.notificationsList ?? []).length > 0 ? (
              data?.notificationsList.map((notification) => (
                <NotificationItem
                  key={notification.notificationId}
                  notification={notification}
                  onClose={onClose}
                  onTouchedNotificationChange={refetch}
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
