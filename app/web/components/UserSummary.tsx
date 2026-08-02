import {
  Box,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled, type Theme } from "@mui/system";
import Avatar from "components/Avatar";
import EllipsisMenu, { EllipsisMenuItem } from "components/EllipsisMenu";
import { PinIcon } from "components/Icons";
import ProfileLink from "components/ProfileLink/ProfileLink";
import { LiteUser } from "proto/api_pb";
import { BlockedUser } from "proto/blocking_pb";
import React, { useState } from "react";

import StrongVerificationBadge from "./StrongVerificationBadge";

// It could be BlockedUser.AsObject or LiteUser.AsObject and only LiteUser has hasStrongVerification
function isLiteUser(
  user: LiteUser.AsObject | BlockedUser.AsObject,
): user is LiteUser.AsObject {
  return "hasStrongVerification" in user;
}

const StyledWrapper = styled("div")({
  display: "flex",
  padding: 0,
  width: "100%",
  minWidth: 0,
  alignItems: "center",
  wordBreak: "break-word",
});

const StyledListItemText = styled(ListItemText, {
  shouldForwardProp: (prop) => prop !== "isSmallAvatar",
})<{ isSmallAvatar: boolean }>(({ theme, isSmallAvatar }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: theme.spacing(0.25),
  margin: 0,
  minHeight: isSmallAvatar ? theme.spacing(6) : theme.spacing(9),
  [theme.breakpoints.down("md")]: {
    minHeight: isSmallAvatar ? theme.spacing(4.5) : theme.spacing(7),
  },
}));

// shared so the avatar and its skeleton can't drift apart and make the row jump when the
// user loads
const avatarSize = (theme: Theme, isSmallAvatar: boolean) => ({
  marginInlineEnd: theme.spacing(2),
  height: isSmallAvatar ? "3rem" : "4.5rem",
  width: isSmallAvatar ? "3rem" : "4.5rem",
  [theme.breakpoints.down("md")]: {
    height: isSmallAvatar ? "2.25rem" : "3.5rem",
    width: isSmallAvatar ? "2.25rem" : "3.5rem",
  },
});

const StyledSkeleton = styled(Skeleton, {
  shouldForwardProp: (prop) => prop !== "isSmallAvatar",
})<{ isSmallAvatar: boolean }>(({ theme, isSmallAvatar }) =>
  avatarSize(theme, isSmallAvatar),
);

const StyledAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== "isSmallAvatar",
})<{ isSmallAvatar: boolean }>(({ theme, isSmallAvatar }) =>
  avatarSize(theme, isSmallAvatar),
);

export const USER_TITLE_SKELETON_TEST_ID = "user-title-skeleton";

interface UserSummaryProps {
  children?: React.ReactNode;
  smallAvatar?: boolean;
  nameOnly?: boolean;
  headlineComponent?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  user?: LiteUser.AsObject | BlockedUser.AsObject;
  titleIsLink?: boolean;
  isProfileLink?: boolean;
  menuItems?: EllipsisMenuItem[];
}

export default function UserSummary({
  children,
  smallAvatar = false,
  nameOnly = false,
  headlineComponent = "h2",
  user,
  titleIsLink = false,
  isProfileLink = true,
  menuItems,
}: UserSummaryProps) {
  const headlineComponentWithRef = React.forwardRef(
    function HeadlineComponentWithRef(props, ref) {
      return React.createElement(headlineComponent, { ...props, ref });
    },
  );

  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLButtonElement | null>(
    null,
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const nameValue = user?.name ?? "";

  const cityValue =
    user && "city" in user && typeof user.city === "string"
      ? user.city.length > 120
        ? user.city.slice(0, 120) + "..."
        : user.city
      : "";

  const title = (
    <Tooltip title={user?.name} arrow placement="top">
      <Typography
        component={headlineComponentWithRef}
        variant="h2"
        noWrap={nameOnly}
        sx={{ marginTop: "auto", minWidth: 0 }}
      >
        {!user ? (
          <Skeleton
            data-testid={USER_TITLE_SKELETON_TEST_ID}
            sx={{ maxWidth: 300 }}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              minWidth: 0,
            }}
          >
            <Box
              component="span"
              sx={{
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {nameValue}
            </Box>
            {isLiteUser(user) && user.hasStrongVerification && (
              <Box component="span" sx={{ flexShrink: 0 }}>
                <StrongVerificationBadge />
              </Box>
            )}
          </Box>
        )}
      </Typography>
    </Tooltip>
  );

  return (
    <StyledWrapper>
      <ListItemAvatar>
        {!user ? (
          <StyledSkeleton variant="circular" isSmallAvatar={smallAvatar} />
        ) : (
          <StyledAvatar
            user={user}
            isProfileLink={isProfileLink}
            isSmallAvatar={smallAvatar}
          />
        )}
      </ListItemAvatar>
      <StyledListItemText
        disableTypography
        isSmallAvatar={smallAvatar}
        primary={
          titleIsLink && user ? (
            <ProfileLink
              userId={"userId" in user ? user.userId : undefined}
              username={user.username}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                minWidth: 0,
              }}
            >
              {title}
            </ProfileLink>
          ) : (
            title
          )
        }
        secondary={
          <>
            {!nameOnly && (
              <Tooltip
                title={(user as LiteUser.AsObject)?.city}
                arrow
                placement="top"
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    minWidth: 0,
                  }}
                >
                  {user && cityValue && (
                    <PinIcon
                      sx={(theme) => ({
                        flexShrink: 0,
                        color: "var(--mui-palette-text-secondary)",
                        fontSize: "1.25rem",
                        [theme.breakpoints.down("md")]: { fontSize: "1rem" },
                      })}
                    />
                  )}
                  <Typography
                    color="textSecondary"
                    variant="body1"
                    noWrap
                    sx={(theme) => ({
                      minWidth: 0,
                      fontSize: "1rem",
                      [theme.breakpoints.down("md")]: { fontSize: "0.875rem" },
                    })}
                  >
                    {!user ? <Skeleton /> : cityValue}
                  </Typography>
                </Box>
              </Tooltip>
            )}
            {children}
          </>
        }
      />

      {menuItems && (
        <EllipsisMenu
          idName={`${user?.username}-summary-menu`}
          isMenuOpen={!!menuAnchorEl}
          menuAnchorEl={menuAnchorEl}
          onMenuOpen={handleMenuOpen}
          onMenuClose={handleMenuClose}
          items={menuItems}
        />
      )}
    </StyledWrapper>
  );
}
