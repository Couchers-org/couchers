import { PingRes } from "@couchers/services/api";
import { NotificationsOutlined } from "@mui/icons-material";
import {
  Badge,
  Tooltip,
  Typography,
  styled,
  useMediaQuery,
} from "@mui/material";
import MuiLink from "@mui/material/Link";
import Link from "next/link";
import React, {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useState,
} from "react";

import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import { AccessibleDialogProps } from "@/components/Dialog";
import IconButton from "@/components/IconButton";
import { MenuIcon } from "@/components/Icons";
import Menu, { MenuItem } from "@/components/Menu";
import NotificationBadge from "@/components/NotificationBadge";
import NotificationsFeed from "@/features/notifications/NotificationsFeed/NotificationsFeed";
import LanguagePickerSelect from "@/features/translate/LanguagePickerSelect";
import useCurrentUser from "@/features/userQueries/useCurrentUser";
import { useTranslation } from "@/i18n";
import { GLOBAL } from "@/i18n/namespaces";
import { theme } from "@/theme";

export type LoggedInMenuLinkItem = {
  type: "link";
  name: string;
  hasBottomDivider?: boolean;
  route: string;
  notificationCount?: number;
  externalLink?: boolean;
};

export type LoggedInMenuDialogItem = {
  type: "dialog";
  name: string;
  hasBottomDivider?: boolean;
  dialogComponent: FunctionComponent<AccessibleDialogProps>;
  dialogLabel: string;
};

export type LoggedInMenuItem = LoggedInMenuLinkItem | LoggedInMenuDialogItem;

const StyledMenu = styled(Menu)(() => ({
  "& .MuiPaper-root": {
    boxShadow: theme.shadows[1],
    minWidth: "12rem",
  },

  "& .MuiPopover-root": {
    transform: "translateY(1rem)",
  },
}));

const StyledMenuButton = styled(Button)(() => ({
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

const StyledAvatar = styled(Avatar)(() => ({
  height: "2rem",
  width: "2rem",
  marginLeft: theme.spacing(1),
}));

const StyledBadge = styled(Badge)(() => ({
  "& .MuiBadge-badge": {
    right: "-4px",
    top: "4px",
  },
}));

const styledMenuItem = <C extends React.ComponentType<React.ComponentProps<C>>>(
  component: C,
) => {
  return styled(component)(() => ({
    width: "100%",
    color: theme.palette.text.primary,
    textDecoration: "none",
    border: "none",
    margin: 0,
    padding: 0,
    textAlign: "left",
    justifyContent: "start",
    background: "none",
    borderRadius: 0,
    boxShadow: "none",
    fontWeight: "normal",
    fontSize: theme.typography.body1.fontSize,
    minHeight: 0,

    "&:hover": {
      background: "none",
      boxShadow: "none",
    },
  }));
};

const StyledMenuItemLink = styledMenuItem(MuiLink);
const StyledMenuItemDialog = styledMenuItem(Button);

const LinkMenuItemView = ({
  externalLink,
  route,
  closeMenu,
  name,
  notificationCount,
}: LoggedInMenuLinkItem & { closeMenu: () => unknown }) => {
  const linkContent = (
    <span style={{ display: "flex", alignItems: "center" }}>
      {notificationCount ? (
        <StyledBadge color="primary" variant="dot">
          <Typography noWrap>{name}</Typography>
        </StyledBadge>
      ) : (
        <Typography noWrap>{name}</Typography>
      )}

      {notificationCount ? (
        <Typography
          noWrap
          variant="subtitle2"
          sx={{ color: theme.palette.grey[500], fontWeight: "bold" }}
        >
          {`${notificationCount} unseen`}
        </Typography>
      ) : null}
    </span>
  );

  return (
    <>
      {externalLink ? (
        <StyledMenuItemLink
          href={route}
          target="_blank"
          rel="noreferrer"
          onClick={closeMenu}
        >
          {linkContent}
        </StyledMenuItemLink>
      ) : (
        <Link
          href={route}
          style={{
            width: "100%",
            color: theme.palette.text.primary,
            textDecoration: "none",
          }}
        >
          {linkContent}
        </Link>
      )}
    </>
  );
};

const DialogMenuItemView = ({
  name,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  dialogComponent: DialogComponent,
  dialogLabel,
}: LoggedInMenuDialogItem & { closeMenu: () => unknown }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <StyledMenuItemDialog
        onClick={() => {
          setIsDialogOpen(true);
        }}
      >
        {name}
      </StyledMenuItemDialog>
      <DialogComponent
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
        }}
        aria-labelledby={dialogLabel}
      />
    </>
  );
};

const MenuItemView = (
  props: LoggedInMenuItem & { closeMenu: () => unknown },
) => {
  return (
    <MenuItem
      hasNotification={props.type === "link" && !!props.notificationCount}
      hasBottomDivider={props.hasBottomDivider}
    >
      {props.type === "link" ? (
        <LinkMenuItemView {...props} closeMenu={props.closeMenu} />
      ) : (
        <DialogMenuItemView {...props} closeMenu={props.closeMenu} />
      )}
    </MenuItem>
  );
};

const NotificationMenuItemWrapper = styled("div")(() => ({
  marginRight: theme.spacing(4),
}));

const LoggedInMenu = ({
  menuOpen,
  notificationCount,
  setMenuOpen,
  items,
}: {
  menuOpen: boolean;
  notificationCount: PingRes.AsObject["unseenNotificationCount"] | undefined;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  items: LoggedInMenuItem[];
}) => {
  const menuRef = React.useRef<HTMLButtonElement>(null);
  const { data: user } = useCurrentUser();
  const { t } = useTranslation([GLOBAL]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
      {!isMobile && <LanguagePickerSelect />}
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
        onClick={() => {
          setMenuOpen((prevMenuOpen: boolean) => !prevMenuOpen);
        }}
        ref={menuRef}
      >
        <MenuIcon sx={{ color: theme.palette.text.primary }} />
        <StyledAvatar user={user} isProfileLink={false} />
      </StyledMenuButton>
      <StyledMenu
        id="navigation-menu"
        open={menuOpen}
        anchorEl={menuRef.current}
        onClose={() => {
          setMenuOpen(false);
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        {items.map((item) => (
          <MenuItemView
            key={item.name}
            {...item}
            closeMenu={() => {
              setMenuOpen(false);
            }}
          />
        ))}
      </StyledMenu>
    </>
  );
};

export default LoggedInMenu;
