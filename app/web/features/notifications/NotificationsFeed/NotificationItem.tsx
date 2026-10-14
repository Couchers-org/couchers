import { Circle, MoreHoriz } from "@mui/icons-material";
import { Avatar, Box, Menu, MenuItem, styled, Typography, useMediaQuery } from "@mui/material";
import IconButton from "components/IconButton";
import RelativeTime from "components/RelativeTime";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { Notification } from "proto/notifications_pb";
import { useState } from "react";
import LinesEllipsis from "react-lines-ellipsis";
import { theme } from "theme";

import { mapNotificationFeedTypeToIcon } from "../utils/constants";

interface NotificationItemProps {
  notification: Notification.AsObject;
  onClose: () => void;
  onMarkIsSeen: (args: { notificationId: Notification.AsObject["notificationId"]; isSeen: boolean }) => void;
}

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: theme.spacing(1.5, 1),
  cursor: "pointer",
  "&:hover, &:focus, &:active": {
    backgroundColor: "var(--mui-palette-action-hover)",
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

const NotificationItem = ({ notification, onClose, onMarkIsSeen }: NotificationItemProps) => {
  const { t } = useTranslation([GLOBAL]);
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [markUnreadMenuAnchorEl, setMarkUnseedMenuAnchorEl] = useState<HTMLButtonElement | null>(null);

  const isMarkUnreadMenuOpen = Boolean(markUnreadMenuAnchorEl);

  const userName = notification.title.split(" ")[0];

  const handleMenuItemClick = () => {
    onMarkIsSeen({
      notificationId: notification.notificationId,
      isSeen: true,
    });
    router.push(notification.url);
    onClose();
  };

  const handleMarkUnreadMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setMarkUnseedMenuAnchorEl(event.currentTarget);
  };

  const handleMarkUnreadMenuClose = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setMarkUnseedMenuAnchorEl(null);
  };

  const handleMarkItemUnread = (event: React.MouseEvent<HTMLLIElement>) => {
    event.stopPropagation();
    setMarkUnseedMenuAnchorEl(null);
    onMarkIsSeen({
      notificationId: notification.notificationId,
      isSeen: false,
    });
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
        <BottomRightIconWrapper>{mapNotificationFeedTypeToIcon[notification.topic]}</BottomRightIconWrapper>
      </AvatarWrapper>
      <FlexColumn>
        <LinesEllipsis
          text={notification.title}
          maxLine={1}
          ellipsis="…"
          style={{
            fontSize: theme.typography.body2.fontSize,
            fontWeight: 600,
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        />
        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
          <RelativeTime instant={notification.created!} />
        </Typography>
        <LinesEllipsis
          text={notification.body}
          maxLine={2}
          ellipsis="…"
          style={{
            fontSize: theme.typography.body2.fontSize,
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        />
      </FlexColumn>
      {!notification.isSeen && (
        <Circle
          sx={{
            color: "var(--mui-palette-primary-main)",
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
            position: "absolute",
            bottom: 0,
            right: 0,
            padding: theme.spacing(0),
            margin: theme.spacing(1),
            visibility: isMobile ? "visible" : "hidden",
            color: "var(--mui-palette-text-secondary)",

            "&:hover, &:focus, &:active": {
              backgroundColor: "var(--mui-palette-action-hover)",
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
        <MenuItem data-testid="mark-unread-menu-item" onClick={handleMarkItemUnread}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {t("notifications:mark_unread")}
          </Typography>
        </MenuItem>
      </Menu>
    </StyledMenuItem>
  );
};

export default NotificationItem;
