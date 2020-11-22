import {
  Avatar as MuiAvatar,
  AvatarProps as MuiAvatarProps,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import React from "react";
import { User } from "../../pb/api_pb";

const useStyles = makeStyles({
  root: { height: "3rem", width: "3rem" },
  grow: {
    height: 0,
    width: "100%",
    paddingTop: "100%",
    "& .MuiAvatar-img": {
      position: "absolute",
      top: 0,
    },
  },
});

export interface AvatarProps extends MuiAvatarProps {
  user: User.AsObject;
  grow?: boolean;
}

export function Avatar({ user, grow, ...otherProps }: AvatarProps) {
  const classes = useStyles();
  return (
    <MuiAvatar
      {...otherProps}
      className={classNames(classes.root, { [classes.grow]: grow })}
      src={user.avatarUrl}
    />
  );
}
