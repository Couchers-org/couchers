import {
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/system";
import Avatar from "components/Avatar";
import EllipsisMenu, { EllipsisMenuItem } from "components/EllipsisMenu";
import { OpenInNewIcon } from "components/Icons";
import ProfileLink from "components/ProfileLink/ProfileLink";
import { LiteUser } from "proto/api_pb";
import { BlockedUser } from "proto/blocking_pb";
import React, { useState } from "react";
import useIsScreenSizeOrSmaller from "utils/useIsScreenSizeOrSmaller";

import StrongVerificationBadge from "./StrongVerificationBadge";

const StyledWrapper = styled("div")({
  display: "flex",
  padding: 0,
  width: "100%",
  alignItems: "center",
  wordBreak: "break-word",
});

const StyledOpenInNewIcon = styled(OpenInNewIcon)(({ theme }) => ({
  display: "block",
  marginInlineStart: theme.spacing(0.5),
  height: "1.25rem",
  width: "1.25rem",
}));

const StyledListItemText = styled(ListItemText)(({ theme }) => ({
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

  const isMobile = useIsScreenSizeOrSmaller("mobile");
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
        component={headlineComponentWithRef}
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
              : `${nameValue}${user && "age" in user ? `, ${user.age}` : ""}`}
            {user &&
            "hasStrongVerification" in user &&
            user.hasStrongVerification ? (
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
            <ProfileLink
              userId={"userId" in user ? user.userId : undefined}
              username={user.username}
              openInNewTab={!isMobile}
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              {title}
              {!isMobile && <StyledOpenInNewIcon />}
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
