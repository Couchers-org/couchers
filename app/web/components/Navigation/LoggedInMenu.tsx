import { NotificationsOutlined } from "@mui/icons-material";
import { Box, styled, Tooltip, Typography, useMediaQuery } from "@mui/material";
import Avatar from "components/Avatar";
import Button from "components/Button";
import IconButton from "components/IconButton";
import Menu, { MenuItem } from "components/Menu";
import NotificationBadge from "components/NotificationBadge";
import NotificationsFeed from "features/notifications/NotificationsFeed/NotificationsFeed";
import LanguagePickerSelect from "features/translate/LanguagePickerSelect";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router";
import { PingRes } from "proto/api_pb";
import React, { Dispatch, FunctionComponent, SetStateAction, useState } from "react";
import { theme } from "theme";
import { useIsNativeEmbed } from "utils/nativeLink";

import { AccessibleDialogProps } from "../Dialog";
import { CloseIcon, MenuIcon } from "../Icons";
import { BOTTOM_NAV_BASE_HEIGHT } from "./constants";

type LoggedInMenuLinkItem = {
  type: "link";
  name: string;
  hasBottomDivider?: boolean;
  route: string;
  notificationCount?: number;
  externalLink?: boolean;
};

type LoggedInMenuDialogItem = {
  type: "dialog";
  name: string;
  hasBottomDivider?: boolean;
  dialogComponent: FunctionComponent<AccessibleDialogProps>;
  dialogLabel: string;
};

export type LoggedInMenuItem = LoggedInMenuLinkItem | LoggedInMenuDialogItem;

const StyledMenu = styled(Menu, {
  shouldForwardProp: (prop) => prop !== "$isNativeEmbed",
})<{ $isNativeEmbed?: boolean }>(({ theme, $isNativeEmbed }) => {
  // Native embed: full height (native tabs handle safe area)
  // Mobile web: subtract bottom nav + safe area
  const menuHeight = $isNativeEmbed
    ? "100vh"
    : `calc(100vh - ${BOTTOM_NAV_BASE_HEIGHT}px - env(safe-area-inset-bottom, 0px))`;

  return {
    "& .MuiPaper-root": {
      boxShadow: theme.shadows[1],
      minWidth: "12rem",
      maxHeight: `calc(100vh - ${100 + BOTTOM_NAV_BASE_HEIGHT}px)`, // Leave space for header, margins, and menu padding

      [theme.breakpoints.down("md")]: {
        width: "100vw",
        height: menuHeight,
        maxWidth: "100vw",
        maxHeight: menuHeight,
        borderRadius: 0,
        margin: 0,
        padding: 0,
        top: 0,
        left: 0,
        position: "fixed",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        zIndex: 1300,
      },
    },

    "& .MuiPopover-paper": {
      [theme.breakpoints.down("md")]: {
        transform: "none !important",
        inset: "0 !important",
      },
    },
  };
});

const StyledMenuButton = styled(Button)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  border: `1px solid var(--mui-palette-grey-300)`,
  borderRadius: 999,
  backgroundColor: "var(--mui-palette-grey-200)",
  transition: `${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
  "&:hover": {
    opacity: 0.8,
    backgroundColor: "var(--mui-palette-grey-300)",
  },
  [theme.breakpoints.down("lg")]: {
    padding: theme.spacing(0.75),
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  height: "2rem",
  width: "2rem",
  marginLeft: theme.spacing(1),
  [theme.breakpoints.down("lg")]: {
    height: "1.75rem",
    width: "1.75rem",
    marginLeft: theme.spacing(0.75),
  },
}));

const styledMenuItem = <C extends React.ComponentType<React.ComponentProps<C>>>(component: C) => {
  return styled(component)(() => ({
    width: "100%",
    color: "var(--mui-palette-text-primary)",
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

const StyledMenuItemLink = styledMenuItem(Link);
const StyledMenuItemDialog = styledMenuItem(Button);

function LinkMenuItemView({
  externalLink,
  route,
  closeMenu,
  name,
  notificationCount,
}: LoggedInMenuLinkItem & { closeMenu: () => unknown }) {
  const router = useRouter();

  const linkContent = (
    <span style={{ display: "flex", alignItems: "center" }}>
      <Typography noWrap sx={{ color: "var(--mui-palette-text-primary)" }}>
        {name}
      </Typography>
      {!!notificationCount && (
        <Box
          sx={{
            backgroundColor: "var(--mui-palette-primary-main)",
            color: "var(--mui-palette-primary-contrastText)",
            borderRadius: theme.spacing(10),
            marginLeft: theme.spacing(0.5),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 600,
            height: theme.spacing(2),
          }}
        >
          {notificationCount > 99 ? "99+" : notificationCount}
        </Box>
      )}
    </span>
  );

  // Internal links: prevent default and navigate in JS so the menu close doesn't
  // consume the tap on mobile (otherwise first tap closes menu, second navigates).
  const handleClick = externalLink
    ? closeMenu
    : (e: React.MouseEvent) => {
        e.preventDefault();
        closeMenu();
        router.push(route);
      };

  return (
    <StyledMenuItemLink
      href={route}
      {...(externalLink && { target: "_blank", rel: "noreferrer" })}
      onClick={handleClick}
    >
      {linkContent}
    </StyledMenuItemLink>
  );
}

function DialogMenuItemView({
  name,
  closeMenu,
  onOpenDialog,
}: Omit<LoggedInMenuDialogItem, "dialogComponent" | "dialogLabel"> & {
  closeMenu: () => unknown;
  onOpenDialog: () => void;
}) {
  return (
    <StyledMenuItemDialog
      onClick={() => {
        onOpenDialog();
        closeMenu();
      }}
    >
      {name}
    </StyledMenuItemDialog>
  );
}

function MenuItemView(
  props: LoggedInMenuItem & {
    closeMenu: () => unknown;
    onOpenDialog?: () => void;
  },
) {
  return (
    <MenuItem
      hasNotification={props.type === "link" && !!props.notificationCount}
      hasBottomDivider={props.hasBottomDivider}
    >
      {props.type === "link" ? (
        <LinkMenuItemView {...props} closeMenu={props.closeMenu} />
      ) : (
        <DialogMenuItemView {...props} closeMenu={props.closeMenu} onOpenDialog={props.onOpenDialog!} />
      )}
    </MenuItem>
  );
}

const NotificationMenuItemWrapper = styled("div")(({ theme }) => ({
  marginRight: theme.spacing(2),

  [theme.breakpoints.down("md")]: {
    marginRight: theme.spacing(1),
  },
}));

export default function LoggedInMenu({
  menuOpen,
  notificationCount,
  setMenuOpen,
  items,
}: {
  menuOpen: boolean;
  notificationCount: PingRes.AsObject["unseenNotificationCount"] | undefined;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  items: LoggedInMenuItem[];
}) {
  const menuRef = React.useRef<HTMLButtonElement>(null);
  const { data: user } = useCurrentUser();
  const { t } = useTranslation([GLOBAL]);
  const isNativeEmbed = useIsNativeEmbed();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<HTMLButtonElement | null>(null);
  const isNotificationsFeedOpen = Boolean(notificationsAnchorEl);

  const [openDialogName, setOpenDialogName] = useState<string | null>(null);

  const handleNotificationsFeedOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsFeedClose = () => {
    setNotificationsAnchorEl(null);
  };

  // Find dialog items ("Report a problem")
  const dialogItems = items.filter((item): item is LoggedInMenuDialogItem => item.type === "dialog");

  return (
    <>
      {!isMobile && (
        <Box sx={{ marginRight: theme.spacing(1) }}>
          <LanguagePickerSelect displayMode="icon" />
        </Box>
      )}
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
                backgroundColor: "var(--mui-palette-grey-200)",
                border: "1px solid var(--mui-palette-grey-300)",
                width: { xs: 36, md: 40 },
                height: { xs: 36, md: 40 },
                "&:hover": {
                  opacity: 0.8,
                  backgroundColor: "var(--mui-palette-grey-300)",
                },
              }}
            >
              <NotificationsOutlined sx={{ fontSize: { xs: 20, md: 24 } }} />
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
        <MenuIcon
          sx={{
            color: "var(--mui-palette-text-primary)",
            fontSize: { xs: 20, lg: 24 },
          }}
        />
        <StyledAvatar user={user} isProfileLink={false} />
      </StyledMenuButton>
      <StyledMenu
        id="navigation-menu"
        open={menuOpen}
        anchorEl={isMobile ? undefined : menuRef.current}
        onClose={(_event: object, reason: string) => {
          if (isMobile && reason === "backdropClick") return;
          setMenuOpen(false);
        }}
        onBlur={(e) => {
          const target = e.relatedTarget as HTMLElement | null;
          // Don't close if focus moves within the menu or to a Select dropdown portal
          if (target?.closest("[role='listbox'], [role='presentation']")) return;
          if (e.currentTarget.contains(target)) return;
          setMenuOpen(false);
        }}
        $isNativeEmbed={isNativeEmbed}
        anchorOrigin={isMobile ? undefined : { vertical: "bottom", horizontal: "right" }}
        transformOrigin={isMobile ? undefined : { vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            style: isMobile
              ? undefined
              : {
                  maxHeight: `calc(100vh - ${100 + BOTTOM_NAV_BASE_HEIGHT}px)`,
                },
          },
        }}
      >
        {isMobile && (
          <Box
            sx={{
              position: "fixed",
              top: `calc(env(safe-area-inset-top, 0px) + ${theme.spacing(1)})`,
              right: theme.spacing(1.5),
              zIndex: 1301, // above menu paper
            }}
          >
            <IconButton
              aria-label={t("global:nav.close_menu_a11y")}
              onClick={() => setMenuOpen(false)}
              sx={{
                backgroundColor: "var(--mui-palette-grey-200)",
                border: "1px solid var(--mui-palette-grey-300)",
                "&:hover": {
                  backgroundColor: "var(--mui-palette-grey-300)",
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        )}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "center", md: "stretch" },
            justifyContent: { xs: "center", md: "flex-start" },
            gap: { xs: 1.5, md: 0 },
            textAlign: { xs: "center", md: "left" },
          }}
        >
          {items.map((item) => (
            <MenuItemView
              key={item.name}
              {...item}
              closeMenu={() => setMenuOpen(false)}
              onOpenDialog={item.type === "dialog" ? () => setOpenDialogName(item.name) : undefined}
            />
          ))}
          {isMobile && (
            <Box
              sx={{
                paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${theme.spacing(2)})`,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <LanguagePickerSelect onNavigate={() => setMenuOpen(false)} />
            </Box>
          )}
        </Box>
      </StyledMenu>
      {dialogItems.map((item) => {
        const DialogComponent = item.dialogComponent;
        return (
          <DialogComponent
            key={item.name}
            open={openDialogName === item.name}
            onClose={() => setOpenDialogName(null)}
            aria-labelledby={item.dialogLabel}
          />
        );
      })}
    </>
  );
}
