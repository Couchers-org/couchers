import { Avatar as MuiAvatar, styled } from "@mui/material";
import Link from "next/link";
import React from "react";

import { LiteUser } from "@/proto/api_pb";
import { routeToUser } from "@/routes";

import { getProfileLinkA11yLabel } from "./constants";

type UserWithAvatarUrl = Pick<
  LiteUser.AsObject,
  "username" | "name" | "avatarUrl"
>;
type UserWithAvatarThumbnailUrl = Pick<
  LiteUser.AsObject,
  "username" | "name" | "avatarThumbnailUrl"
>;
interface AvatarPropsHighRes {
  children?: React.ReactNode;
  highRes?: true;
  user?: UserWithAvatarUrl;
  grow?: boolean;
  className?: string;
  isProfileLink?: boolean;
  style?: React.CSSProperties;
  openInNewTab?: boolean;
}

interface AvatarPropsLowRes
  extends Omit<AvatarPropsHighRes, "highRes" | "user"> {
  highRes?: false | undefined;
  user?: UserWithAvatarThumbnailUrl;
}

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

export default function Avatar({
  user,
  highRes,
  grow,
  className,
  isProfileLink = true,
  openInNewTab = false,
  ...otherProps
}: AvatarPropsHighRes | AvatarPropsLowRes) {
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
            <StyledMuiAvatar
              alt={user.name}
              src={
                !!highRes
                  ? (user as UserWithAvatarUrl).avatarUrl
                  : (user as UserWithAvatarThumbnailUrl).avatarThumbnailUrl
              }
            >
              {user.name.split(/\s+/).map((name) => name[0])}
            </StyledMuiAvatar>
          </StyledLink>
        ) : (
          <StyledMuiAvatar
            alt={user.name}
            src={
              !!highRes
                ? (user as UserWithAvatarUrl).avatarUrl
                : (user as UserWithAvatarThumbnailUrl).avatarThumbnailUrl
            }
          >
            {user.name.split(/\s+/).map((name) => name[0])}
          </StyledMuiAvatar>
        )
      ) : otherProps.children ? (
        <StyledMuiAvatar>{otherProps.children}</StyledMuiAvatar>
      ) : (
        <StyledMuiAvatar />
      )}
    </StyledWrapper>
  );
}
