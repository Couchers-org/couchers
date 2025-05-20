import { NotificationsOutlined } from "@mui/icons-material";
import { Button, styled, Tooltip } from "@mui/material";
import Avatar from "components/Avatar";
import IconButton from "components/IconButton";
import { MenuIcon } from "components/Icons";
import LanguagePickerSelect from "components/LanguagePickerSelect";
import Menu from "components/Menu";
import NotificationBadge from "components/NotificationBadge";
import NotificationsFeed from "features/notifications/NotificationsFeed/NotificationsFeed";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { PingRes } from "proto/api_pb";
import React, { Dispatch, ReactNode, SetStateAction, useState } from "react";
import { theme } from "theme";

import ReportButton from "./ReportButton";

const StyledMenu = styled(Menu)(({ theme }) => ({
  "& .MuiPaper-root": {
    boxShadow: theme.shadows[1],
    minWidth: "12rem",
  },

  "& .MuiPopover-root": {
    transform: "translateY(1rem)",
  },
}));

const StyledMenuButton = styled(Button)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  border: `1px solid ${theme.palette.grey[300]}`,
  borderRadius: 999,
  backgroundColor: theme.palette.grey[200],
  padding: theme.spacing(1),
  transition: `${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
  "&:hover": {
    opacity: 0.8,
    backgroundColor: theme.palette.grey[300],
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  height: "2rem",
  width: "2rem",
  marginLeft: theme.spacing(1),
}));

const ReportButtonContainer = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
}));

const NotificationMenuItemWrapper = styled("div")(({ theme }) => ({
  marginRight: theme.spacing(4),
}));

export default function LoggedInMenu({
  menuOpen,
  notificationCount,
  setMenuOpen,
  children,
}: {
  menuOpen: boolean;
  notificationCount: PingRes.AsObject["unseenNotificationCount"] | undefined;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
}) {
  const menuRef = React.useRef<HTMLButtonElement>(null);
  const { data: user } = useCurrentUser();
  const { t } = useTranslation([GLOBAL]);

  const [notificationsAnchorEl, setNotificationsAnchorEl] =
    useState<HTMLButtonElement | null>(null);
  const isNotificationsFeedOpen = Boolean(notificationsAnchorEl);

  const handleNotificationsFeedOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsFeedClose = () => {
    setNotificationsAnchorEl(null);
  };

  return (
    <>
      <LanguagePickerSelect
        defaultValue=""
        value=""
        onSelect={() => console.log("selected")}
      />
      <ReportButtonContainer>
        <ReportButton />
      </ReportButtonContainer>
      <Tooltip title={t("global:nav.notifications")}>
        <NotificationMenuItemWrapper>
          <NotificationBadge count={notificationCount}>
            <IconButton
              id="notifications-feed-button"
              onClick={handleNotificationsFeedOpen}
              aria-label={t("global:nav.notifications")}
              aria-controls="notifications-feed"
              aria-haspopup="true"
              aria-expanded={isNotificationsFeedOpen ? "true" : undefined}
              sx={{
                backgroundColor: theme.palette.grey[300],
                "&:hover": {
                  opacity: 0.8,
                  backgroundColor: theme.palette.grey[300],
                },
              }}
            >
              <NotificationsOutlined />
            </IconButton>
          </NotificationBadge>
        </NotificationMenuItemWrapper>
      </Tooltip>
      <NotificationsFeed
        isOpen={isNotificationsFeedOpen}
        anchorEl={notificationsAnchorEl}
        onClose={handleNotificationsFeedClose}
      />
      <StyledMenuButton
        aria-controls="navigation-menu"
        aria-haspopup="true"
        onClick={() => setMenuOpen((prevMenuOpen: boolean) => !prevMenuOpen)}
        ref={menuRef}
      >
        <MenuIcon sx={{ color: theme.palette.text.primary }} />
        <StyledAvatar user={user} isProfileLink={false} />
      </StyledMenuButton>
      <StyledMenu
        id="navigation-menu"
        open={menuOpen}
        anchorEl={menuRef.current}
        onClose={() => setMenuOpen(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        {children}
      </StyledMenu>
    </>
  );
}
