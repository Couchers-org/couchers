import { Avatar as MuiAvatar, Skeleton, styled } from "@mui/material";
import Link from "next/link";
import { LiteUser } from "proto/api_pb";
import React from "react";
import { routeToUser } from "routes";

import { getProfileLinkA11yLabel } from "./constants";

const StyledWrapper = styled("div")<{
  isDefaultSize: boolean;
  grow: boolean | undefined;
}>(({ isDefaultSize, grow }) => ({
  flexShrink: 0,
  position: "relative",
  ...(isDefaultSize && { height: "3rem", width: "3rem" }),
  ...(grow && { height: 0, paddingTop: "min(18rem, 100%)", width: "100%" }),
}));

const StyledLink = styled(Link)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

const StyledMuiAvatar = styled(MuiAvatar)(() => ({
  height: "100%",
  position: "absolute",
  top: 0,
  width: "100%",
  maxWidth: "18rem",
  maxHeight: "18rem",
}));

const StyledSkeleton = styled(Skeleton)(() => ({
  height: "100%",
  position: "absolute",
  top: 0,
  width: "100%",
  maxWidth: "18rem",
  maxHeight: "18rem",
}));

export interface AvatarProps {
  children?: React.ReactNode;
  user?: LiteUser.AsObject;
  grow?: boolean;
  className?: string;
  isProfileLink?: boolean;
  style?: React.CSSProperties;
  openInNewTab?: boolean;
}

export default function Avatar({
  user,
  grow,
  className,
  isProfileLink = true,
  openInNewTab = false,
  ...otherProps
}: AvatarProps) {
  return (
    <StyledWrapper
      isDefaultSize={!className}
      grow={grow}
      className={className}
      {...otherProps}
    >
      {user ? (
        isProfileLink ? (
          <StyledLink
            href={routeToUser(user.username)}
            aria-label={getProfileLinkA11yLabel(user.name)}
            target={openInNewTab ? "_blank" : undefined}
          >
            <StyledMuiAvatar alt={user.name} src={user.avatarUrl}>
              {user.name.split(/\s+/).map((name) => name[0])}
            </StyledMuiAvatar>
          </StyledLink>
        ) : (
          <StyledMuiAvatar alt={user.name} src={user.avatarUrl}>
            {user.name.split(/\s+/).map((name) => name[0])}
          </StyledMuiAvatar>
        )
      ) : otherProps.children ? (
        <StyledMuiAvatar>{otherProps.children}</StyledMuiAvatar>
      ) : (
        <StyledSkeleton variant="circular" />
      )}
    </StyledWrapper>
  );
}
