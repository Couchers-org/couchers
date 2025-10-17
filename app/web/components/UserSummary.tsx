import { LiteUser } from "@couchers/services/api";
import { BlockedUser } from "@couchers/services/blocking";
import {
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Tooltip,
  Typography,
  styled,
} from "@mui/material";
import React, { useState } from "react";

import Avatar from "@/components/Avatar";
import EllipsisMenu, { EllipsisMenuItem } from "@/components/EllipsisMenu";
import { OpenInNewIcon } from "@/components/Icons";
import StyledLink from "@/components/StyledLink";
import { routeToUser } from "@/routes";
import { theme } from "@/theme";

import StrongVerificationBadge from "./StrongVerificationBadge";

const StyledWrapper = styled("div")(() => ({
  display: "flex",
  padding: 0,
  width: "100%",
  alignItems: "center",
  wordBreak: "break-word",
}));

const StyledOpenInNewIcon = styled(OpenInNewIcon)(() => ({
  display: "block",
  marginInlineStart: theme.spacing(0.5),
  height: "1.25rem",
  width: "1.25rem",
}));

const StyledListItemText = styled(ListItemText)(() => ({
  display: "grid",
  gap: theme.spacing(0.25),
  margin: 0,
  minHeight: theme.spacing(9),
}));

const StyledSkeleton = styled(Skeleton, {
  shouldForwardProp: (prop) => prop !== "isSmallAvatar",
})<{ isSmallAvatar: boolean }>(({ theme, isSmallAvatar }) => ({
  marginInlineEnd: theme.spacing(2),
  height: isSmallAvatar ? "3rem" : "4.5rem",
  width: isSmallAvatar ? "3rem" : "4.5rem",
}));

const StyledAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== "isSmallAvatar",
})<{ isSmallAvatar: boolean }>(({ theme, isSmallAvatar }) => ({
  marginInlineEnd: theme.spacing(2),
  height: isSmallAvatar ? "3rem" : "4.5rem",
  width: isSmallAvatar ? "3rem" : "4.5rem",
}));

export const USER_TITLE_SKELETON_TEST_ID = "user-title-skeleton";

export interface UserSummaryProps {
  children?: React.ReactNode;
  smallAvatar?: boolean;
  nameOnly?: boolean;
  headlineComponent?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  user?: LiteUser.AsObject | BlockedUser.AsObject;
  titleIsLink?: boolean;
  isProfileLink?: boolean;
  menuItems?: EllipsisMenuItem[];
}

const UserSummary = ({
  children,
  smallAvatar = false,
  nameOnly = false,
  headlineComponent = "h2",
  user,
  titleIsLink = false,
  isProfileLink = true,
  menuItems,
}: UserSummaryProps) => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const HeadlineComponentWithRef = React.forwardRef((props, ref) => {
    return React.createElement(headlineComponent, { ...props, ref });
  });

  HeadlineComponentWithRef.displayName = "HeadlineComponent";

  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLButtonElement | null>(
    null,
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const nameValue =
    user && user.name
      ? user.name.length > 20
        ? user.name.slice(0, 20) + "..."
        : user.name
      : "";

  const cityValue =
    user && "city" in user && typeof user.city === "string"
      ? user.city.length > 120
        ? user.city.slice(0, 120) + "..."
        : user.city
      : "";

  const title = (
    <Tooltip title={user?.name} arrow placement="top">
      <Typography
        component={HeadlineComponentWithRef}
        variant="h2"
        noWrap={nameOnly}
        sx={{ marginTop: "auto", fontSize: "1.2rem" }}
      >
        {!user ? (
          <Skeleton
            data-testid={USER_TITLE_SKELETON_TEST_ID}
            sx={{ maxWidth: 300 }}
          />
        ) : (
          <>
            {nameOnly
              ? nameValue
              : `${nameValue}${"age" in user ? `, ${user.age}` : ""}`}
            {"hasStrongVerification" in user && user.hasStrongVerification ? (
              <StrongVerificationBadge />
            ) : null}
          </>
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
        primary={
          titleIsLink && user ? (
            <StyledLink
              href={routeToUser(user.username)}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: "flex", alignItems: "center" }}
            >
              {title}
              <StyledOpenInNewIcon />
            </StyledLink>
          ) : (
            title
          )
        }
        secondary={
          <>
            {!nameOnly && (
              <Tooltip
                title={(user as LiteUser.AsObject).city}
                arrow
                placement="top"
              >
                <Typography
                  color="textSecondary"
                  variant="body1"
                  noWrap={nameOnly}
                >
                  {!user ? <Skeleton /> : cityValue}
                </Typography>
              </Tooltip>
            )}
            {children}
          </>
        }
      />

      {menuItems && (
        <EllipsisMenu
          idName={`${user?.username || ""}-summary-menu`}
          isMenuOpen={!!menuAnchorEl}
          menuAnchorEl={menuAnchorEl}
          onMenuOpen={handleMenuOpen}
          onMenuClose={handleMenuClose}
          items={menuItems}
        />
      )}
    </StyledWrapper>
  );
};

export default UserSummary;
