import { Avatar as MuiAvatar, styled } from "@mui/material";
import ProfileLink from "components/ProfileLink/ProfileLink";
import { LiteUser } from "proto/api_pb";
import React from "react";

import { getProfileLinkA11yLabel } from "./constants";

type UserWithAvatarUrl = Pick<LiteUser.AsObject, "username" | "name" | "avatarUrl"> & {
  userId?: number;
};
type UserWithAvatarThumbnailUrl = Pick<LiteUser.AsObject, "username" | "name" | "avatarThumbnailUrl"> & {
  userId?: number;
};
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

interface AvatarPropsLowRes extends Omit<AvatarPropsHighRes, "highRes" | "user"> {
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

const linkStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

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
  const avatarImg = user ? (
    <StyledMuiAvatar
      alt={user.name}
      src={!!highRes ? (user as UserWithAvatarUrl).avatarUrl : (user as UserWithAvatarThumbnailUrl).avatarThumbnailUrl}
    >
      {user.name.split(/\s+/).map((name) => name[0])}
    </StyledMuiAvatar>
  ) : null;

  return (
    <StyledWrapper isDefaultSize={!className} grow={grow} className={className} {...otherProps}>
      {user ? (
        isProfileLink ? (
          <ProfileLink
            userId={user.userId}
            username={user.username}
            aria-label={getProfileLinkA11yLabel(user.name)}
            openInNewTab={openInNewTab}
            style={linkStyle}
          >
            {avatarImg}
          </ProfileLink>
        ) : (
          avatarImg
        )
      ) : otherProps.children ? (
        <StyledMuiAvatar>{otherProps.children}</StyledMuiAvatar>
      ) : (
        <StyledMuiAvatar />
      )}
    </StyledWrapper>
  );
}
