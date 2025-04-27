import { Circle, MoreHoriz } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Menu,
  MenuItem,
  styled,
  Typography,
  useMediaQuery,
} from "@mui/material";
import IconButton from "components/IconButton";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { Notification } from "proto/notifications_pb";
import { useState } from "react";
import LinesEllipsis from "react-lines-ellipsis";
import { markNotificationSeen } from "service/notifications";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import { timeAgoI18n } from "utils/timeAgo";

import { mapNotificationFeedTypeToIcon } from "../utils/constants";

interface NotificationItemProps {
  notification: Notification.AsObject;
  onClose: () => void;
  onTouchedNotificationChange: () => void;
}

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: theme.spacing(1.5, 1),
  cursor: "pointer",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const FlexColumn = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  width: "100%",
  paddingLeft: theme.spacing(2),
  overflow: "hidden",
  minWidth: 0,
}));

const AvatarWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  width: theme.spacing(5),
  height: theme.spacing(5),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const BottomRightIconWrapper = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: -2,
  right: -2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const NotificationItem = ({
  notification,
  onClose,
  onTouchedNotificationChange,
}: NotificationItemProps) => {
  const { t } = useTranslation([GLOBAL]);
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [markUnreadMenuAnchorEl, setMarkUnseedMenuAnchorEl] =
    useState<HTMLButtonElement | null>(null);

  const isMarkUnreadMenuOpen = Boolean(markUnreadMenuAnchorEl);

  const userName = notification.title.split(" ")[0];

  const handleMenuItemClick = async () => {
    await markNotificationSeen(notification.notificationId);
    router.push(notification.url);
    onClose();
  };

  const handleMarkUnreadMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    setMarkUnseedMenuAnchorEl(event.currentTarget);
  };

  const handleMarkUnreadMenuClose = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.stopPropagation();
    setMarkUnseedMenuAnchorEl(null);
  };

  const handleMarkItemUnread = async (
    event: React.MouseEvent<HTMLLIElement>,
  ) => {
    event.stopPropagation();
    setMarkUnseedMenuAnchorEl(null);
    await markNotificationSeen(notification.notificationId, false);
    onTouchedNotificationChange();
  };

  return (
    <StyledMenuItem
      data-testid="notification-item"
      key={notification.key}
      onClick={handleMenuItemClick}
      sx={{
        position: "relative",

        "&:hover .hover-icon": {
          visibility: "visible",
        },
      }}
    >
      <AvatarWrapper>
        <Avatar alt={userName} src={notification.icon} />
        <BottomRightIconWrapper>
          {mapNotificationFeedTypeToIcon[notification.topic]}
        </BottomRightIconWrapper>
      </AvatarWrapper>
      <FlexColumn>
        <LinesEllipsis
          text={notification.title}
          maxLine={2}
          ellipsis="..."
          style={{
            fontSize: theme.typography.body2.fontSize,
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        />
        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
          {timeAgoI18n({
            input: timestamp2Date(notification.created!),
            t,
          })}
        </Typography>
      </FlexColumn>
      {!notification.isSeen && (
        <Circle
          sx={{
            color: theme.palette.primary.main,
            fontSize: ".9rem",
            position: "absolute",
            right: theme.spacing(1),
            bottom: theme.spacing(1),
          }}
        />
      )}
      {notification.isSeen && (
        <IconButton
          className="hover-icon"
          aria-label={t("notifications:mark_unread")}
          data-testid="mark-unread-menu-button"
          onClick={handleMarkUnreadMenuOpen}
          size="small"
          sx={{
            backgroundColor: theme.palette.common.white,
            position: "absolute",
            bottom: 0,
            right: 0,
            padding: theme.spacing(0),
            margin: theme.spacing(1),
            visibility: isMobile ? "visible" : "hidden",

            "&:hover": {
              backgroundColor: theme.palette.grey[300],
            },
          }}
        >
          <MoreHoriz />
        </IconButton>
      )}
      <Menu
        anchorEl={markUnreadMenuAnchorEl}
        id="mark-unseen-menu"
        open={isMarkUnreadMenuOpen}
        onClose={handleMarkUnreadMenuClose}
        onClick={handleMarkUnreadMenuClose}
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
        <MenuItem
          data-testid="mark-unread-menu-item"
          onClick={handleMarkItemUnread}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {t("notifications:mark_unread")}
          </Typography>
        </MenuItem>
      </Menu>
    </StyledMenuItem>
  );
};

export default NotificationItem;
