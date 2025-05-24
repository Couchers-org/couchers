import {
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Typography,
} from "@mui/material";
import { styled } from "@mui/system";
import Avatar from "components/Avatar";
import { OpenInNewIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import { LiteUser } from "proto/api_pb";
import React from "react";
import { routeToUser } from "routes";

import StrongVerificationBadge from "./StrongVerificationBadge";

const StyledWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  padding: 0,
  width: "100%",
  alignItems: "center",
  wordBreak: "break-word",
}));

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

export interface UserSummaryProps {
  children?: React.ReactNode;
  smallAvatar?: boolean;
  nameOnly?: boolean;
  headlineComponent?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  user?: LiteUser.AsObject;
  titleIsLink?: boolean;
}

export default function UserSummary({
  children,
  smallAvatar = false,
  nameOnly = false,
  headlineComponent = "h2",
  user,
  titleIsLink = false,
}: UserSummaryProps) {
  const headlineComponentWithRef = React.forwardRef(
    function HeadlineComponentWithRef(props, ref) {
      return React.createElement(headlineComponent, { ...props, ref });
    },
  );

  const title = (
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
          {nameOnly ? user.name : `${user.name}, ${user.age}`}
          {user.hasStrongVerification ? <StrongVerificationBadge /> : null}
        </>
      )}
    </Typography>
  );

  return (
    <StyledWrapper>
      <ListItemAvatar>
        {!user ? (
          <StyledSkeleton variant="circular" isSmallAvatar={smallAvatar} />
        ) : (
          <StyledAvatar
            user={user}
            isProfileLink={true}
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
              <Typography
                color="textSecondary"
                variant="body1"
                noWrap={nameOnly}
              >
                {!user ? <Skeleton /> : user.city}
              </Typography>
            )}
            {children}
          </>
        }
      />
    </StyledWrapper>
  );
}
